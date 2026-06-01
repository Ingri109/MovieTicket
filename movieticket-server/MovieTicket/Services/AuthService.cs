using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using MovieTicket.Data;
using MovieTicket.DTOs.Auth;
using MovieTicket.Events;
using MovieTicket.Interfaces;
using MovieTicket.Models;

namespace MovieTicket.Services;

public class AuthService: IAuthService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IConfiguration _config;
    private readonly IPublishEndpoint _publishEndpoint;

    public AuthService(AppDbContext context, IMapper mapper, IConfiguration config, IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _mapper = mapper;
        _config = config;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<(bool Success, string Message)> RegisterAsync(UserRegisterDto registerDto)
    {
        if (await _context.Users.AnyAsync(u => u.Email == registerDto.Email))
            return (false, "Користувач з таким email вже існує."); // Користувач вже існує

        var verificationToken = Guid.NewGuid().ToString("N");
        var user = _mapper.Map<User>(registerDto);
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(registerDto.Password);
        user.Role = UserRole.Customer;
        user.IsEmailConfirmed = false;
        user.VerificationToken = verificationToken;
        
        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        var emailEvent = new UserRegisteredEvent
        {
            Email = user.Email,
            VerificationToken = verificationToken
        };
        await _publishEndpoint.Publish(emailEvent);

        return (true, "Реєстрація успішна! Перевірте вашу пошту для підтвердження.");
    }

    public async Task<(bool Success, string? Token, string? ErrorMessage)> LoginAsync(string email, string password)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == email);

        if (user == null || !BCrypt.Net.BCrypt.Verify(password, user.PasswordHash)) 
            return (false, null, "Невірний email або пароль.");
        
        if (!user.IsEmailConfirmed)
            return (false, null, "Ваш обліковий запис не активовано. Будь ласка, перевірте електронну пошту.");

        var token = CreateToken(user);
        return (true, token, null);
    }

    private string CreateToken(User user)
    {
        var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Email, user.Email),
            new Claim(ClaimTypes.Name, user.Email),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
        };
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var token = new JwtSecurityToken(
            issuer: _config["Jwt:Issuer"],
            audience: _config["Jwt:Audience"],
            claims: claims,
            expires: DateTime.Now.AddDays(1),
            signingCredentials: creds
        );
        return new JwtSecurityTokenHandler().WriteToken(token);
    }
    
    public async Task<bool> ConfirmEmailAsync(string token)
    {
        var user = await _context.Users.FirstOrDefaultAsync(u => u.VerificationToken == token);
        
        if (user == null)
            return false;

        user.IsEmailConfirmed = true;
        user.VerificationToken = null; 
        
        await _context.SaveChangesAsync();
        return true;
    }
}
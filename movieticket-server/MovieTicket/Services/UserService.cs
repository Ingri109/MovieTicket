using MovieTicket.Interfaces;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MovieTicket.Data;
using MovieTicket.DTOs.Auth;

namespace MovieTicket.Services;

public class UserService : IUserService
{
    private readonly IMapper _mapper;
    private readonly AppDbContext _context;

    public UserService(IMapper mapper, AppDbContext context)
    {
        _context = context;
        _mapper = mapper;
    }

    public async Task<UserProfileDto?> GetUserProfileAsync(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);

        if (user == null)
            return null;
        
        return _mapper.Map<UserProfileDto>(user);
    }

    public async Task<IEnumerable<UserProfileDto>> GetAllUsersAsync()
    {
        var users = await _context.Users.ToListAsync();
        return _mapper.Map<IEnumerable<UserProfileDto>>(users);
    }
    
}
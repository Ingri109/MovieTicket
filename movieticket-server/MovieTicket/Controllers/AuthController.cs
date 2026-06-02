using Microsoft.AspNetCore.Mvc;
using MovieTicket.DTOs.Auth;
using MovieTicket.Interfaces;

namespace MovieTicket.Controllers;

[Route("api/[controller]")]
[ApiController]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;

    public AuthController(IAuthService authService)
    {
        _authService = authService;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] UserRegisterDto request)
    {
        var result = await _authService.RegisterAsync(request);
        
        if (!result.Success)
            return BadRequest(new { message = result.Message });

        return Ok(new { message = result.Message });
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] UserLoginDto request)
    {
        var result = await _authService.LoginAsync(request.Email, request.Password);
        
        if (!result.Success)
            return Unauthorized(new { message = result.ErrorMessage }); // Віддаємо помилку, яку сформував сервіс

        return Ok(new { token = result.Token });
    }

    [HttpGet("confirm-email")]
    public async Task<IActionResult> ConfirmEmail([FromQuery] string token)
    {
        var frontendAuthUrl = "https://movie-ticket-tau.vercel.app/auth";

        if (string.IsNullOrWhiteSpace(token))
        {
            // Перенаправляємо з помилкою
            return Redirect($"{frontendAuthUrl}?error=missing_token");
        }

        var success = await _authService.ConfirmEmailAsync(token);
        
        if (!success)
        {
            // Перенаправляємо з помилкою валідації
            return Redirect($"{frontendAuthUrl}?error=invalid_token");
        }

        // Успішне підтвердження: перенаправляємо на логін з прапорцем успіху
        return Redirect($"{frontendAuthUrl}?verified=true");
    }
}
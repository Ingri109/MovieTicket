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
        if (string.IsNullOrWhiteSpace(token))
            return BadRequest(new { message = "Токен відсутній." });

        var success = await _authService.ConfirmEmailAsync(token);
        
        if (!success)
            return BadRequest(new { message = "Недійсний або прострочений токен підтвердження." });

        return Ok(new { message = "Електронну пошту успішно підтверджено! Тепер ви можете увійти." });
    }
}
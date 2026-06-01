using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTicket.Interfaces;
using MovieTicket.Models;

namespace MovieTicket.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize]
public class UserController : ControllerBase
{
    private readonly IUserService _userService;

    public UserController(IUserService userService)
    {
        _userService = userService;
    }

    [HttpGet("me")]
    public async Task<IActionResult> GetMyProfile()
    {
        var userIdString = User.FindFirst(ClaimTypes.NameIdentifier).Value;
        
        if(string.IsNullOrEmpty(userIdString)|| !Guid.TryParse(userIdString, out Guid userId))
        {
            return Unauthorized();
        }
        
        var profile = await _userService.GetUserProfileAsync(userId);
        
        if (profile == null)
            return NotFound(new { message = "Користувача не знайдено." });
        return Ok(profile);
    }
    
    [HttpGet("all")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> GetAllUsers()
    {
        var users = await _userService.GetAllUsersAsync();
        return Ok(users);
    }
}
using MovieTicket.DTOs.Auth;
using MovieTicket.Models;

namespace MovieTicket.Interfaces;

public interface IAuthService
{
    Task<(bool Success, string Message)> RegisterAsync(UserRegisterDto registerDto);
    Task<(bool Success, string? Token, string? ErrorMessage)> LoginAsync(string email, string password);
    Task<bool> ConfirmEmailAsync(string token);
}
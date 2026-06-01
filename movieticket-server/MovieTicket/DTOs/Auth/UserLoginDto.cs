using System.ComponentModel.DataAnnotations;
namespace MovieTicket.DTOs.Auth;

public class UserLoginDto
{
    [Required(ErrorMessage = "Email є обов'язковим")]
    [EmailAddress(ErrorMessage = "Некоректний формат Email")]
    public string Email { get; set; } = string.Empty;

    [Required(ErrorMessage = "Пароль є обов'язковим")]
    public string Password { get; set; } = string.Empty; 
}
using System.ComponentModel.DataAnnotations;
using MovieTicket.Models;

namespace MovieTicket.DTOs.Auth;

public class AdminCreateUserDto
{
    [Required(ErrorMessage = "Ім'я є обов'язковим.")]
    [MaxLength(50, ErrorMessage = "Ім'я не може бути довшим за 50 символів.")]
    public string Name { get; set; } = string.Empty;

    [Required, EmailAddress] public string Email { get; set; } = string.Empty;

    [Required, MinLength(6, ErrorMessage = "Password must have at least 6 characters")]
    public string Password { get; set; } = string.Empty;

    public UserRole Role { get; set; }
}
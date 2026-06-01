using MovieTicket.Models;

namespace MovieTicket.DTOs.Auth;

public class UserProfileDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public UserRole Role { get; set; }
    public bool IsEmailConfirmed { get; set; }
}
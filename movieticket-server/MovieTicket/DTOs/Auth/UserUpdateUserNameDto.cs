using System.ComponentModel.DataAnnotations;

namespace MovieTicket.DTOs.Auth;

public class UserUpdateUserNameDto
{
    [Required(ErrorMessage = "Нове ім'я є обов'язковим.")]
    [MaxLength(50)]
    public string NewName { get; set; } = string.Empty;
}
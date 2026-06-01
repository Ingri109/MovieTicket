using System.ComponentModel.DataAnnotations;

namespace MovieTicket.DTOs.Halls;

public class HallCreateDto
{
    [Required, MaxLength(50)] 
    public string Name { get; set; } = string.Empty;

    [Range(10, 1000, ErrorMessage = "Місткість залу має бути від 10 до 1000 місць")] 
    public int Capacity { get; set; }
    
    public int RequestedVipSeats { get; set; }
    public int RequestedPremiumSeats { get; set; }
}
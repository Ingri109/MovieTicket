using System.ComponentModel.DataAnnotations;

namespace MovieTicket.DTOs.Sessions;

public class SessionCreateDto
{
    [Required] public Guid MovieId { get; set; }

    [Required] public Guid HallId { get; set; }

    [Required] public DateTime StartTime { get; set; }

    [Range(0.01, 10000, ErrorMessage = "Price must be bigger 0")]
    public decimal Price { get; set; }
}
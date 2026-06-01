using System.ComponentModel.DataAnnotations;

namespace MovieTicket.DTOs.Tickets;

public class TicketBookDto
{
    [Required] public Guid SessionId { get; set; }
    [Required] public Guid SeatId { get; set; } 
}
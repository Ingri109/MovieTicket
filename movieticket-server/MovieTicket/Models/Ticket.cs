using Microsoft.EntityFrameworkCore;

namespace MovieTicket.Models;

[Index(nameof(SessionId))]
[Index(nameof(UserId))]
public class Ticket
{
    public Guid Id { get; set; }
    
    // Хто і на який сеанс
    public Guid? UserId { get; set; }
    public User? User { get; set; }
    public Guid SessionId { get; set; }
    public Session Session { get; set; } = null!;
    
    // Яке конкретно крісло
    public Guid SeatId { get; set; }
    public Seat Seat { get; set; } = null!;
    
    // Фінальна ціна покупки та час
    public decimal Price { get; set; } 
    public DateTime PurchaseTime { get; set; } = DateTime.UtcNow;
}
namespace MovieTicket.Models;

public class Session
{
    public Guid Id { get; set; }
    public DateTime StartTime { get; set; }
    
    public decimal Price { get; set; }

    public Guid MovieId { get; set; }
    public Movie Movie { get; set; } = null!;

    public Guid HallId { get; set; }
    public Hall Hall { get; set; } = null!;
}
namespace MovieTicket.DTOs.Sessions;

public class SessionDto
{
    public Guid Id { get; set; }
    public Guid MovieId { get; set; }
    public string MovieTitle { get; set; } = string.Empty; // Назва фільму для зручності
    public Guid HallId { get; set; }
    public string MoviePosterUrl { get; set; } = string.Empty;
    public string HallName { get; set; } = string.Empty; // Назва залу
    public DateTime StartTime { get; set; }
    public decimal Price { get; set; }
}
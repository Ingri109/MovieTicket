namespace MovieTicket.DTOs.Tickets;

public class TicketDto
{
    public Guid Id { get; set; }
    public Guid SessionId { get; set; }
    public string MovieTitle { get; set; } = string.Empty;
    
    // ДОДАЄМО ПОЛЕ ДЛЯ ФОТОГРАФІЇ
    public string MoviePosterUrl { get; set; } = string.Empty; 
    
    public DateTime StartTime { get; set; }
    public int RowNumber { get; set; }
    public int SeatNumber { get; set; }
    public decimal Price { get; set; }
    public DateTime PurchaseTime { get; set; }
}
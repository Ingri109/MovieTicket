namespace MovieTicket.Models;

public class Seat
{
    public Guid Id { get; set; }
    
    public Guid HallId { get; set; }
    public Hall Hall { get; set; } = null!;

    public int RowNumber { get; set; }
    public int SeatNumber { get; set; }
    
    // Тип крісла
    public SeatType Type { get; set; } = SeatType.Basic;
    
    // Множник ціни (наприклад: Basic = 1.0, Premium = 1.3, Vip = 1.6)
    public decimal PriceMultiplier { get; set; } = 1.0m;
}
namespace MovieTicket.DTOs.Sessions;

public class SeatStatusDto
{
    public Guid SeatId { get; set; }
    public int RowNumber { get; set; }
    public int SeatNumber { get; set; }
    
    // Тип крісла (0 - Basic, 1 - Premium, 2 - Vip), щоб фронтенд знав, яким кольором малювати
    public int Type { get; set; } 
    
    // Вже прорахована фінальна ціна для конкретного місця
    public decimal FinalPrice { get; set; } 
    
    // "Free" або "Booked"
    public string Status { get; set; } = string.Empty;
}
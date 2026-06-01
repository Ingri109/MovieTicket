namespace MovieTicket.Events;

public class TicketBookedEvent
{
    public Guid TicketId { get; init; }
    public string UserEmail { get; init; } = string.Empty;
    public string MovieTitle { get; init; } = string.Empty;
    public DateTime StartTime { get; init; }
    public int RowNumber { get; init; }
    public int SeatNumber { get; init; }
}
using MovieTicket.DTOs.Tickets;

namespace MovieTicket.Interfaces;

public interface ITicketService
{
    Task<TicketDto?> BookTicketAsync(Guid userId, TicketBookDto request);
    
    // Отримання історії квитків для особистого кабінету користувача
    Task<IEnumerable<TicketDto>> GetUserTicketsAsync(Guid userId);
}
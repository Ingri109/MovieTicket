using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MovieTicket.Data;
using MovieTicket.DTOs.Tickets;
using MovieTicket.Interfaces;
using MovieTicket.Models;
using MassTransit;
using MovieTicket.Events;

namespace MovieTicket.Services;

public class TicketService : ITicketService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IPublishEndpoint _publishEndpoint;

    public TicketService(AppDbContext context, IMapper mapper, IPublishEndpoint publishEndpoint)
    {
        _context = context;
        _mapper = mapper;
        _publishEndpoint = publishEndpoint;
    }

    public async Task<TicketDto?> BookTicketAsync(Guid userId, TicketBookDto request)
    {
        // 1. Знаходимо сеанс і фізичне місце
        var session = await _context.Sessions.FindAsync(request.SessionId);
        var seat = await _context.Seats.FindAsync(request.SeatId);

        if (session == null || seat == null) return null;

        // 2. Безпека: Перевіряємо, чи це місце взагалі належить залу, де проходить сеанс
        if (seat.HallId != session.HallId)
            throw new Exception("Обране місце не належить залу цього сеансу.");

        // 3. ЗАХИСТ ВІД ОДНОЧАСНОЇ КУПІВЛІ (Race Condition)
        // Перевіряємо, чи немає вже успішного квитка на це місце в цьому сеансі
        var isAlreadyBooked = await _context.Tickets
            .AnyAsync(t => t.SessionId == request.SessionId && t.SeatId == request.SeatId);

        if (isAlreadyBooked)
            throw new Exception("На жаль, це місце щойно купив хтось інший.");

        // 4. Створюємо квиток (чек)
        var ticket = new Ticket
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            SessionId = request.SessionId,
            SeatId = request.SeatId,

            // Математика: Фіксуємо історичну ціну покупки (Базова ціна сеансу * коефіцієнт крісла)
            Price = session.Price * seat.PriceMultiplier,
            PurchaseTime = DateTime.UtcNow
        };

        await _context.Tickets.AddAsync(ticket);
        await _context.SaveChangesAsync();

        // 5. Завантажуємо зв'язки (Session -> Movie), щоб AutoMapper зміг заповнити MovieTitle для DTO
        var savedTicket = await _context.Tickets
            .Include(t => t.Session)
            .ThenInclude(s => s.Movie)
            .Include(t => t.Seat)
            .Include(t => t.User)
            .FirstOrDefaultAsync(t => t.Id == ticket.Id);

        if (savedTicket?.User?.Email != null)
        {
            var ticketEvent = new TicketBookedEvent
            {
                TicketId = savedTicket.Id,
                UserEmail = savedTicket.User.Email,
                MovieTitle = savedTicket.Session.Movie.Title,
                StartTime = savedTicket.Session.StartTime,
                RowNumber = savedTicket.Seat.RowNumber,
                SeatNumber = savedTicket.Seat.SeatNumber
            };
            
            await _publishEndpoint.Publish(ticketEvent);
        }

        return _mapper.Map<TicketDto>(savedTicket);
    }

    public async Task<IEnumerable<TicketDto>> GetUserTicketsAsync(Guid userId)
    {
        // Додаємо .Include(t => t.Seat), щоб дані крісла завантажувались із бази
        var tickets = await _context.Tickets
            .Include(t => t.Session)
            .ThenInclude(s => s.Movie)
            .Include(t => t.Seat) // Ось цей рядок завантажить потрібні дані
            .Where(t => t.UserId == userId)
            .OrderByDescending(t => t.PurchaseTime)
            .ToListAsync();

        return _mapper.Map<IEnumerable<TicketDto>>(tickets);
    }
    
}
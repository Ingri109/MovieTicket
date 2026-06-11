using AutoMapper;
using Microsoft.EntityFrameworkCore;
using MovieTicket.Data;
using MovieTicket.DTOs.Sessions;
using MovieTicket.Interfaces;
using MovieTicket.Models;

namespace MovieTicket.Services;

public class SessionService : ISessionService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;

    public SessionService(AppDbContext context, IMapper mapper)
    {
        _context = context;
        _mapper = mapper;
    }
    
    public async Task<IEnumerable<SessionDto>> GetSessionsByMovieIdAsync(Guid movieId)
    {
        var sessions = await _context.Sessions
            .Include(s => s.Movie)
            .Include(s => s.Hall)
            .Where(s => s.MovieId == movieId && s.StartTime >= DateTime.UtcNow) // Показуємо тільки майбутні сеанси
            .OrderBy(s => s.StartTime)
            .ToListAsync();

        return _mapper.Map<IEnumerable<SessionDto>>(sessions);
    }
    
    public async Task<IEnumerable<SessionDto>> GetSessionsByDateAsync(DateTime date)
    {
        var utcDate = DateTime.SpecifyKind(date.Date, DateTimeKind.Utc);
        
        var startOfDay = utcDate;
        var endOfDay = startOfDay.AddDays(1);

        var sessions = await _context.Sessions
            .Include(s => s.Movie)
            .Include(s => s.Hall)
            .Where(s => s.StartTime >= startOfDay && s.StartTime < endOfDay)
            .OrderBy(s => s.StartTime)
            .AsNoTracking()
            .ToListAsync();

        return _mapper.Map<IEnumerable<SessionDto>>(sessions);
    }

    public async Task<SessionDto?> GetSessionByIdAsync(Guid id)
    {
        var session = await _context.Sessions
            .Include(s => s.Movie)
            .Include(s => s.Hall)
            .FirstOrDefaultAsync(s => s.Id == id);

        return session == null ? null : _mapper.Map<SessionDto>(session);
    }
    
    public async Task<SessionDto?> CreateSessionAsync(SessionCreateDto sessionDto)
    {
        // 1. Знаходимо фільм, щоб дізнатися його тривалість
        var movie = await _context.Movies.FindAsync(sessionDto.MovieId);
        if (movie == null) return null; // Фільм не знайдено

        // 2. Рахуємо час початку і приблизний час закінчення (додаємо 30 хвилин на прибирання та рекламу)
        var newSessionStart = sessionDto.StartTime;
        var newSessionEnd = newSessionStart.AddMinutes(movie.DurationMinutes + 30);

        // 3. Перевіряємо, чи немає в цьому залі інших сеансів, які перекриваються з нашим часом
        var hasOverlap = await _context.Sessions
            .Include(s => s.Movie)
            .Where(s => s.HallId == sessionDto.HallId)
            .AnyAsync(s => 
                // Якщо початок існуючого сеансу потрапляє в проміжок нового
                (s.StartTime >= newSessionStart && s.StartTime < newSessionEnd) ||
                // АБО якщо кінець існуючого сеансу потрапляє в проміжок нового
                (s.StartTime.AddMinutes(s.Movie.DurationMinutes + 30) > newSessionStart && s.StartTime <= newSessionStart)
            );

        // Якщо є накладання - повертаємо null (або можна викинути кастомний Exception)
        if (hasOverlap) return null; 

        // 4. Якщо все чисто, створюємо сеанс
        var session = _mapper.Map<Session>(sessionDto);
        await _context.Sessions.AddAsync(session);
        await _context.SaveChangesAsync();

        // Завантажуємо пов'язані дані для правильного мапінгу у DTO
        await _context.Entry(session).Reference(s => s.Movie).LoadAsync();
        await _context.Entry(session).Reference(s => s.Hall).LoadAsync();

        return _mapper.Map<SessionDto>(session);
    }

    public async Task<bool> DeleteSessionAsync(Guid id)
    {
        var session = await _context.Sessions.FindAsync(id);
        if (session == null) return false;

        _context.Sessions.Remove(session);
        await _context.SaveChangesAsync();
        return true;
    }
    
    public async Task<IEnumerable<SeatStatusDto>> GetSeatMatrixForSessionAsync(Guid sessionId)
    {
        // 1. Знаходимо сеанс (потрібен, щоб дізнатися HallId та базову ціну)
        var session = await _context.Sessions.FindAsync(sessionId);
        if (session == null) throw new Exception("Session not found");

        // 2. Беремо всі фізичні місця цього залу
        var allSeats = await _context.Seats
            .Where(s => s.HallId == session.HallId)
            .ToListAsync();

        // 3. Шукаємо квитки, які ВЖЕ куплені на цей сеанс (беремо тільки ID місць)
        var bookedSeatIds = await _context.Tickets
            .Where(t => t.SessionId == sessionId)
            .Select(t => t.SeatId)
            .ToListAsync();

        // 4. Формуємо фінальну матрицю
        var seatMatrix = allSeats.Select(seat => new SeatStatusDto
        {
            SeatId = seat.Id,
            RowNumber = seat.RowNumber,
            SeatNumber = seat.SeatNumber,
            Type = (int)seat.Type, // Перетворюємо Enum на число для фронтенду
        
            // Математика: Базова ціна сеансу * множник місця (наприклад: 150 * 1.6 для VIP = 240)
            FinalPrice = session.Price * seat.PriceMultiplier, 
        
            // Якщо ID місця є у списку куплених квитків -> Booked, інакше -> Free
            Status = bookedSeatIds.Contains(seat.Id) ? "Booked" : "Free"
        }).OrderBy(s => s.RowNumber).ThenBy(s => s.SeatNumber).ToList();

        return seatMatrix;
    }
}
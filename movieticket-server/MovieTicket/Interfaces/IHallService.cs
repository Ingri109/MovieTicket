using MovieTicket.DTOs.Halls;
using MovieTicket.DTOs.Sessions;

namespace MovieTicket.Interfaces;

public interface IHallService
{
    Task<IEnumerable<HallDto>> GetAllHallsAsync();
    Task<HallDto?> GetHallByIdAsync(Guid id);
    Task<HallDto> CreateHallAsync(HallCreateDto hallDto);
    Task<bool> UpdateHallAsync(Guid id, HallCreateDto hallDto);
    Task<bool> DeleteHallAsync(Guid id);
}

public interface ISessionService
{
    Task<IEnumerable<SessionDto>> GetSessionsByMovieIdAsync(Guid movieId);
    
    // Отримати всі сеанси на конкретну дату (для головної сторінки розкладу)
    Task<IEnumerable<SessionDto>> GetSessionsByDateAsync(DateTime date);
    
    Task<SessionDto?> GetSessionByIdAsync(Guid id);
    
    // Створення з перевіркою зайнятості залу!
    Task<SessionDto?> CreateSessionAsync(SessionCreateDto sessionDto);
    
    Task<bool> DeleteSessionAsync(Guid id);
    
    Task<IEnumerable<SeatStatusDto>> GetSeatMatrixForSessionAsync(Guid sessionId);
}
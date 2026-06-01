using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTicket.DTOs.Sessions;
using MovieTicket.Interfaces;

namespace MovieTicket.Controllers;

[Route("api/[controller]")]
[ApiController]
public class SessionController : ControllerBase
{
    private readonly ISessionService _sessionService;

    public SessionController(ISessionService sessionService)
    {
        _sessionService = sessionService;
    }

    [HttpGet("by-movie/{movieId}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSessionsByMovie(Guid movieId)
    {
        var sessions = await _sessionService.GetSessionsByMovieIdAsync(movieId);
        return Ok(sessions);    
    }

    [HttpGet("by-date")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSessionsByDate([FromQuery] DateTime date)
    {
        var sessions = await _sessionService.GetSessionsByDateAsync(date);
        return Ok(sessions);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetSessionById(Guid id)
    {
        var session = await _sessionService.GetSessionByIdAsync(id);
        if(session == null) return NotFound(new {message = "Session not found."});
        return Ok(session);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateSession([FromBody] SessionCreateDto request)
    {
        var session = await _sessionService.CreateSessionAsync(request);
        if (session == null)
            return BadRequest(
                new { message = "Неможливо створити сеанс. Зал зайнятий у цей час або фільм не знайдено" });
        return CreatedAtAction(nameof(GetSessionById), new { id = session.Id }, session);
    }
    
    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteSession(Guid id)
    {
        var success = await _sessionService.DeleteSessionAsync(id);
        if (!success) return NotFound(new { message = "Сеанс не знайдено" });
        
        return NoContent();
    }
    
    [HttpGet("{sessionId}/seats")]
    [AllowAnonymous] // Дозволяємо дивитися вільні місця навіть без авторизації
    public async Task<IActionResult> GetSeatMatrix(Guid sessionId)
    {
        try
        {
            var seatMatrix = await _sessionService.GetSeatMatrixForSessionAsync(sessionId);
            
            // Якщо масив порожній, значить або сеансу не існує, або для залу ще не згенерували місця
            if (!seatMatrix.Any()) 
                return NotFound(new { message = "Місця для цього сеансу не знайдені." });

            return Ok(seatMatrix);
        }
        catch (Exception ex)
        {
            // Перехоплюємо помилку, якщо сеанс не знайдено (ми кидали Exception у сервісі)
            return BadRequest(new { message = ex.Message });
        }
    }
}
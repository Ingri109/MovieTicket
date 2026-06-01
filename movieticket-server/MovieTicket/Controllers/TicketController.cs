using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTicket.DTOs.Tickets;
using MovieTicket.Interfaces;

namespace MovieTicket.Controllers;

[Route("api/[controller]")]
[ApiController]
[Authorize] // Тільки зареєстровані користувачі з токеном мають доступ
public class TicketController : ControllerBase
{
    private readonly ITicketService _ticketService;

    public TicketController(ITicketService ticketService)
    {
        _ticketService = ticketService;
    }

    [HttpPost("book")]
    public async Task<IActionResult> BookTicket([FromBody] TicketBookDto request)
    {
        // Безпечно витягуємо ID користувача (NameIdentifier) з його Claims у JWT токені
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
        {
            return Unauthorized(new { message = "Не вдалося ідентифікувати користувача. Перевірте токен." });
        }

        try
        {
            var ticket = await _ticketService.BookTicketAsync(userId, request);
            if (ticket == null) 
                return NotFound(new { message = "Сеанс або місце не знайдено." });

            return Ok(ticket);
        }
        catch (Exception ex)
        {
            // Сюди потрапить помилка, якщо місце вже зайняте (Race Condition) або з іншого залу
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpGet("my-tickets")]
    public async Task<IActionResult> GetMyTickets()
    {
        var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out Guid userId))
        {
            return Unauthorized(new { message = "Не вдалося ідентифікувати користувача." });
        }

        var tickets = await _ticketService.GetUserTicketsAsync(userId);
        return Ok(tickets);
    }
}
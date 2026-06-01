using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTicket.DTOs.Halls;
using MovieTicket.Interfaces;

namespace MovieTicket.Controllers;

[Route("api/[controller]")]
[ApiController]
public class HallController : ControllerBase
{
    private readonly IHallService _hallService;

    public HallController(IHallService hallService)
    {
        _hallService = hallService;
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllHalls()
    {
        var halls = await _hallService.GetAllHallsAsync();
        return Ok(halls);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetHallById(Guid id)
    {
        var hall = await _hallService.GetHallByIdAsync(id);
        if (hall == null) return NotFound(new { message = "Зал не знайдено" });

        return Ok(hall);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateHall([FromBody] HallCreateDto request)
    {
        var hall = await _hallService.CreateHallAsync(request);
        return CreatedAtAction(nameof(GetHallById), new { id = hall.Id }, hall);
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateHall(Guid id, [FromBody] HallCreateDto request)
    {
        var success = await _hallService.UpdateHallAsync(id, request);
        if (!success) return NotFound(new { message = "Зал не знайдено" });

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteHall(Guid id)
    {
        var success = await _hallService.DeleteHallAsync(id);
        if (!success) return NotFound(new { message = "Зал не знайдено" });

        return NoContent();
    }
}
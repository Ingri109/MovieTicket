using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using MovieTicket.DTOs.Movies;
using MovieTicket.Interfaces;


namespace MovieTicket.Controllers;


[Route("api/[controller]")]
[ApiController]
public class MovieController : ControllerBase
{
    private readonly IMovieService _movieService;


    public MovieController(IMovieService movieService)
    {
        _movieService = movieService;
        
        
    }

    [HttpGet]
    [AllowAnonymous]
    public async Task<IActionResult> GetAllMovies([FromQuery] MovieQueryParameters queryParams)
    {
        var result = await _movieService.GetAllMoviesAsync(queryParams);
        return Ok(result);
    }

    [HttpGet("{id}")]
    [AllowAnonymous]
    public async Task<IActionResult> GetMovieById(Guid id)
    {
        var movie = await _movieService.GetMovieByIdAsync(id);
        if (movie == null) return NotFound(new { message = "Фільм не знайдено" });

        return Ok(movie);
    }

    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> CreateMovie([FromBody] MovieCreateDto request)
    {
        var movie = await _movieService.CreateMovieAsync(request);
        return CreatedAtAction(nameof(GetMovieById), new { id = movie.Id }, movie);
    }
    
    [HttpPost("upload-poster")]
    public async Task<IActionResult> UploadPoster(IFormFile file)
    {
        try
        {
            var posterUrl = await _movieService.UploadPosterAsync(file);
            return Ok(new { url = posterUrl }); // Повертаємо URL на фронтенд
        }
        catch (ArgumentException ex)
        {
            return BadRequest(new { message = ex.Message });
        }
    }

    [HttpPut("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> UpdateMovie(Guid id, [FromBody] MovieCreateDto request)
    {
        var success = await _movieService.UpdateMovieAsync(id, request);
        if (!success) return NotFound(new { message = "Фільм не знайдено" });

        return NoContent();
    }

    [HttpDelete("{id}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> DeleteMovie(Guid id)
    {
        var success = await _movieService.DeleteMovieAsync(id);
        if (!success) return NotFound(new { message = "Фільм не знайдено" });

        return NoContent();
    }
}
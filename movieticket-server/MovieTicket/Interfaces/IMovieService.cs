using MovieTicket.DTOs.Common;
using MovieTicket.DTOs.Movies;

namespace MovieTicket.Interfaces;

public interface IMovieService
{
    // Тепер повертає пагінований результат і приймає параметри для фільтрів/сортування
    Task<PagedResult<MovieDto>> GetAllMoviesAsync(MovieQueryParameters queryParams);
    
    // Отримання конкретного фільму (тут під капотом працюватиме IMemoryCache)
    Task<MovieDto?> GetMovieByIdAsync(Guid id);
    
    // Адмінські методи
    Task<MovieDto> CreateMovieAsync(MovieCreateDto movieDto);
    Task<bool> UpdateMovieAsync(Guid id, MovieCreateDto movieDto);
    Task<bool> DeleteMovieAsync(Guid id);
    Task<string> UploadPosterAsync(IFormFile file);
}
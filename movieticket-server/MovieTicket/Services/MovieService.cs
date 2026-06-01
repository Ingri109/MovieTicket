using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Memory;
using MovieTicket.Data;
using MovieTicket.DTOs.Common;
using MovieTicket.DTOs.Movies;
using MovieTicket.Interfaces;
using MovieTicket.Models;

namespace MovieTicket.Services;

public class MovieService : IMovieService
{
    private readonly AppDbContext _context;
    private readonly IMapper _mapper;
    private readonly IMemoryCache _cache;
    private readonly IWebHostEnvironment _environment;

    public MovieService(AppDbContext context, IMapper mapper, IMemoryCache cache, IWebHostEnvironment environment)
    {
        _context = context;
        _mapper = mapper;
        _cache = cache;
        _environment = environment;
    }

    public async Task<PagedResult<MovieDto>> GetAllMoviesAsync(MovieQueryParameters queryParams)
    {
        var query = _context.Movies.AsQueryable();

        if (!string.IsNullOrWhiteSpace(queryParams.SearchTerm))
        {
            var searchTerm = queryParams.SearchTerm.ToLower();
            query = query.Where(m =>
                m.Title.ToLower().Contains(searchTerm) || m.Description.ToLower().Contains(searchTerm));
        }

        if (!string.IsNullOrWhiteSpace(queryParams.Genres))
        {
            var genre = queryParams.Genres.ToLower();
            query = query.Where(m => m.Genres.Any(g => g.ToLower() == genre));
        }

        if (!string.IsNullOrWhiteSpace(queryParams.SortBy))
        {
            query = queryParams.SortBy.ToLower() switch
            {
                "title" => queryParams.IsDescending
                    ? query.OrderByDescending(m => m.Title)
                    : query.OrderBy(m => m.Title),
                "year" => queryParams.IsDescending
                    ? query.OrderByDescending(m => m.ReleaseYear)
                    : query.OrderBy(m => m.ReleaseYear),
                "duration" => queryParams.IsDescending
                    ? query.OrderByDescending(m => m.DurationMinutes)
                    : query.OrderBy(m => m.DurationMinutes),
                _ => query.OrderBy(m => m.Title)
            };
        }
        else
        {
            query = query.OrderByDescending(m => m.ReleaseYear);
        }

        var totalCount = await query.CountAsync();
        var movies = await query
            .Skip((queryParams.PageNumber - 1) * queryParams.PageSize)
            .Take(queryParams.PageSize)
            .ToListAsync();

        return new PagedResult<MovieDto>
        {
            Items = _mapper.Map<IEnumerable<MovieDto>>(movies),
            TotalCount = totalCount,
            PageNumber = queryParams.PageNumber,
            PageSize = queryParams.PageSize
        };
    }

    public async Task<MovieDto?> GetMovieByIdAsync(Guid id)
    {
        string cacheKey = $"movie_{id}";

        if (!_cache.TryGetValue(cacheKey, out MovieDto? movieDto))
        {
            var movie = await _context.Movies.FirstOrDefaultAsync(m => m.Id == id);
            if (movie != null) return null;

            movieDto = _mapper.Map<MovieDto>(movie);

            _cache.Set(cacheKey, movieDto, TimeSpan.FromMinutes(4));
        }

        return movieDto;
    }

    public async Task<MovieDto> CreateMovieAsync(MovieCreateDto movieDto)
    {
        var movie = _mapper.Map<Movie>(movieDto);
        await _context.Movies.AddAsync(movie);
        await _context.SaveChangesAsync();

        return _mapper.Map<MovieDto>(movie);
    }

    public async Task<string> UploadPosterAsync(IFormFile file)
    {
        if (file == null || file.Length == 0)
        {
            throw new ArgumentException("Файл не вибрано або він порожній.");
        }

        var uploadsFolder = Path.Combine(_environment.WebRootPath, "images", "posters");
        if (!Directory.Exists(uploadsFolder))
        {
            Directory.CreateDirectory(uploadsFolder);
        }

        // Генеруємо унікальне ім'я файлу
        var uniqueFileName = $"{Guid.NewGuid()}_{Path.GetFileName(file.FileName)}";
        var filePath = Path.Combine(uploadsFolder, uniqueFileName);

        // Зберігаємо файл
        using (var stream = new FileStream(filePath, FileMode.Create))
        {
            await file.CopyToAsync(stream);
        }

        // Повертаємо відносний шлях, який буде записаний у PosterUrl
        return $"/images/posters/{uniqueFileName}";
    }

    public async Task<bool> UpdateMovieAsync(Guid id, MovieCreateDto movieDto)
    {
        var movie = await _context.Movies.FirstOrDefaultAsync(m => m.Id == id);
        if (movie == null) return false;

        _mapper.Map(movieDto, movie);
        await _context.SaveChangesAsync();

        _cache.Remove($"movie_{id}");
        return true;
    }

    public async Task<bool> DeleteMovieAsync(Guid id)
    {
        var movie = await _context.Movies.FirstOrDefaultAsync(m => m.Id == id);
        if (movie == null) return false;

        _context.Movies.Remove(movie);
        await _context.SaveChangesAsync();

        _cache.Remove($"movie_{id}");
        return true;
    }
}
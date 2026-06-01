using System.ComponentModel.DataAnnotations;

namespace MovieTicket.DTOs.Movies;

public class MovieCreateDto
{
    [Required(ErrorMessage = "Title is required")]
    [MaxLength(100)]
    public string Title { get; set; } = String.Empty;

    [Required] public string Description { get; set; } = String.Empty;

    [Range(1, 500, ErrorMessage = "Rating must be between 1 and 500")]
    public int DurationMinutes { get; set; }

    public string PosterUrl { get; set; } = String.Empty;

    [Range(1895, 2100)] public int ReleaseYear { get; set; }

    public List<string> Genres { get; set; } = new();
    public List<string> Actors { get; set; } = new();
}
namespace MovieTicket.DTOs.Movies;

public class MovieFilterParams
{
    public int PageNumber { get; set; } = 1;
    public int PageSize { get; set; } = 10;

    public string? Genres { get; set; }
    public string? Actors { get; set; }
    public string? ReleaseYear { get; set; }
    public string? SearchTerm { get; set; }
}
using AutoMapper;
using MovieTicket.Models;
using MovieTicket.DTOs.Auth;
using MovieTicket.DTOs.Movies;
using MovieTicket.DTOs.Halls;
using MovieTicket.DTOs.Sessions;
using MovieTicket.DTOs.Tickets;

namespace MovieTicket.Profiles;

public class AppMappingProfile : Profile
{
    public AppMappingProfile()
    {
        // ==========================================
        // 1.Users
        // ==========================================
        CreateMap<User, UserProfileDto>();

        CreateMap<UserRegisterDto, User>().ForMember(dest => dest.PasswordHash, opt => opt.Ignore());

        CreateMap<AdminCreateUserDto, User>().ForMember(dest => dest.PasswordHash, opt => opt.Ignore());

        // ==========================================
        // 2.Movies
        // ==========================================
        CreateMap<Movie, MovieDto>();
        CreateMap<MovieCreateDto, Movie>();

        // ==========================================
        // 3.Halls
        // ==========================================
        CreateMap<Hall, HallDto>();
        CreateMap<HallCreateDto, Hall>();
        // ==========================================
        // 4.Sessions
        // ==========================================
        CreateMap<SessionCreateDto, Session>();
        CreateMap<Session, SessionDto>()
            .ForMember(dest => dest.MovieTitle, opt => opt.MapFrom(src => src.Movie.Title))
            .ForMember(dest => dest.HallName, opt => opt.MapFrom(src => src.Hall.Name));
        // ==========================================
        // 5.Tickets
        // ==========================================
        CreateMap<Ticket, TicketDto>()
            .ForMember(dest => dest.MovieTitle, opt => opt.MapFrom(src => src.Session.Movie.Title))
            .ForMember(dest => dest.StartTime, opt => opt.MapFrom(src => src.Session.StartTime))
            .ForMember(dest => dest.MoviePosterUrl, opt => opt.MapFrom(src => src.Session.Movie.PosterUrl))
            .ForMember(dest => dest.RowNumber, opt => opt.MapFrom(src => src.Seat.RowNumber))       
            .ForMember(dest => dest.SeatNumber, opt => opt.MapFrom(src => src.Seat.SeatNumber));
        CreateMap<TicketBookDto, Ticket>();
    }
}
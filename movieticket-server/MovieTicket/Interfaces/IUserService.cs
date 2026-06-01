using MovieTicket.DTOs.Auth;

namespace MovieTicket.Interfaces;

public interface IUserService
{
    Task<UserProfileDto>GetUserProfileAsync(Guid userId);
    Task<IEnumerable<UserProfileDto>> GetAllUsersAsync();
}
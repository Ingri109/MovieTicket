namespace MovieTicket.Models;

public enum UserRole
{
    Customer,
    Admin
}

public enum TicketStatus
{
    Free,
    Locked,
    Sold
}

public enum SeatType
{
    Basic = 0,
    Premium = 1,
    Vip = 2
}
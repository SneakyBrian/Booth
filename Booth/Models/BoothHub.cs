using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;

namespace Booth.Models
{
    public class BoothHub : Hub
    {
        public async Task JoinBooth(string boothName)
        {
            //http://www.asp.net/signalr/overview/guide-to-the-api/working-with-groups

            await Groups.Add(Context.ConnectionId, boothName);
            Clients.Group(boothName).onJoinedBooth(Context.ConnectionId);
        }

        public Task LeaveBooth(string boothName)
        {
            return Groups.Remove(Context.ConnectionId, boothName);
        }
    }
}
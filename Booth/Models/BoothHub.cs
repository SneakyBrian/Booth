using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Web;
using Microsoft.AspNet.SignalR;
using System.Collections.Concurrent;

namespace Booth.Models
{
    public class BoothHub : Hub
    {
        private static ConcurrentDictionary<string, string> _groupMembership = new ConcurrentDictionary<string, string>();

        /// <summary>
        /// Join The Booth
        /// </summary>
        /// <param name="boothName"></param>
        /// <returns></returns>
        public async Task JoinBooth(string boothName)
        {
            //http://www.asp.net/signalr/overview/guide-to-the-api/working-with-groups

            await Groups.Add(Context.ConnectionId, boothName);

            _groupMembership.TryAdd(Context.ConnectionId, boothName);

            Clients.OthersInGroup(boothName).onJoinedBooth(Context.ConnectionId);
        }

        /// <summary>
        /// Leave the Booth
        /// </summary>
        /// <param name="boothName"></param>
        /// <returns></returns>
        public Task LeaveBooth(string boothName)
        {
            var dummy = "";
            _groupMembership.TryRemove(Context.ConnectionId, out dummy);

            Clients.OthersInGroup(boothName).onLeftBooth(Context.ConnectionId);

            return Groups.Remove(Context.ConnectionId, boothName);
        }

        /// <summary>
        /// Send Signalling Info
        /// </summary>
        /// <param name="signallingInfo"></param>
        public void SendSignallingInfo(string signallingInfo)
        {
            var boothName = "";
            if (_groupMembership.TryGetValue(Context.ConnectionId, out boothName))
            {
                Clients.OthersInGroup(boothName).onSignallingInfoRecieved(Context.ConnectionId, signallingInfo);
            }
        }
    }
}
using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using Booth.Models;

namespace Booth.Controllers
{
    public class BoothController : Controller
    {
        public ActionResult Enter(string boothName)
        {
            return View(new BoothModel { Name = boothName });
        }
    }
}

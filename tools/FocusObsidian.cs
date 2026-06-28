using System;
using System.Diagnostics;
using System.Globalization;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using System.Threading;

public class FocusObsidian : Form {
    [DllImport("user32.dll")]
    static extern bool SetForegroundWindow(IntPtr hWnd);
    [DllImport("user32.dll")]
    static extern bool ShowWindow(IntPtr hWnd, int nCmdShow);
    [DllImport("user32.dll")]
    static extern bool IsIconic(IntPtr hWnd);
    [DllImport("user32.dll")]
    static extern IntPtr GetForegroundWindow();
    [DllImport("user32.dll")]
    static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint pid);
    [DllImport("kernel32.dll")]
    static extern uint GetCurrentThreadId();
    [DllImport("user32.dll")]
    static extern bool AttachThreadInput(uint idAttach, uint idAttachTo, bool fAttach);

    public FocusObsidian() {
        WindowState = FormWindowState.Minimized;
        ShowInTaskbar = false;
        Load += (s, e) => {
            IntPtr hWnd = IntPtr.Zero;
            foreach (var p in Process.GetProcessesByName("Obsidian")) {
                if (p.MainWindowHandle != IntPtr.Zero) { hWnd = p.MainWindowHandle; break; }
            }
            if (hWnd == IntPtr.Zero) { Console.Write("F"); Close(); return; }

            if (IsIconic(hWnd)) { ShowWindow(hWnd, 9); Thread.Sleep(300); }

            uint fgPid, targetPid;
            IntPtr fgHwnd = GetForegroundWindow();
            uint fgTid = GetWindowThreadProcessId(fgHwnd, out fgPid);
            uint targetTid = GetWindowThreadProcessId(hWnd, out targetPid);
            uint thisTid = GetCurrentThreadId();
            AttachThreadInput(thisTid, fgTid, true);
            SetForegroundWindow(hWnd);
            AttachThreadInput(thisTid, fgTid, false);
            Thread.Sleep(300);

            // Switch to US English
            InputLanguage.CurrentInputLanguage = InputLanguage.FromCulture(new CultureInfo("en-US"));
            Thread.Sleep(200);

            // Open ExcaliBrain via command palette
            SendKeys.SendWait("^p");
            Thread.Sleep(2000);
            SendKeys.SendWait("ExcaliBrain Normal");
            Thread.Sleep(1500);
            SendKeys.SendWait("{ENTER}");
            Thread.Sleep(3000);

            // Close palette -> ExcaliBrain search gets focus
            SendKeys.SendWait("{ESC}");
            Thread.Sleep(1000);

            // Ensure English
            InputLanguage.CurrentInputLanguage = InputLanguage.FromCulture(new CultureInfo("en-US"));
            Thread.Sleep(200);

            // Type date to find today's daily note: 2026-06-28
            SendKeys.SendWait("2026-06-28");
            Thread.Sleep(2000);

            // Press Enter to navigate
            SendKeys.SendWait("{ENTER}");
            Thread.Sleep(2000);

            Console.Write("OK");
            Close();
        };
    }
    static void Main() { Application.Run(new FocusObsidian()); }
}

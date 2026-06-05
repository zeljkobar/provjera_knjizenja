Set WshShell = CreateObject("WScript.Shell")
WshShell.CurrentDirectory = "C:\Users\zeljk\Desktop\provjera knjizenja"
WshShell.Run """C:\Program Files\nodejs\node.exe"" server.js", 0, False

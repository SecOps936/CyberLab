"""
Seed script to populate the database with sample labs.
Run this after the database tables are created.
"""
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from backend.core.database import SessionLocal
from backend.models.lab import Lab
import json
import uuid

def seed_labs():
    db = SessionLocal()
    
    try:
        # Clear existing labs before seeding to avoid duplicate rows
        db.query(Lab).delete()
        db.commit()

        labs_data = [
            {
                "id": str(uuid.uuid4())[:8],
                "title": "SQL Injection Fundamentals",
                "category": "web",
                "difficulty": "beginner",
                "time": "45 min",
                "points": 150,
                "participants": 0,
                "description": "Learn the basics of SQL injection attacks and how to exploit them.",
                "long_description": """In this comprehensive lab, you'll dive deep into one of the most critical web application vulnerabilities. SQL injection occurs when user input is not properly sanitized, allowing attackers to manipulate database queries.

You'll learn to:
• Identify SQL injection vulnerabilities in web forms
• Craft payloads to extract sensitive data
• Understand different types of SQL injection attacks
• Learn about blind SQL injection techniques
• Explore automated tools for SQL injection testing

This lab provides a safe, controlled environment to practice these techniques ethically and understand how to defend against them.""",
                "objectives": [
                    "Identify SQL injection vulnerabilities in login forms",
                    "Extract user credentials from the database",
                    "Bypass authentication using SQL injection",
                    "Understand the impact of SQL injection attacks",
                    "Learn basic mitigation techniques"
                ],
                "prerequisites": [
                    "Basic understanding of SQL queries",
                    "Familiarity with web applications",
                    "Knowledge of HTTP requests and responses"
                ],
                "hints": [
                    "Start by testing the login form with simple payloads like ' OR 1=1--",
                    "Pay attention to error messages - they can reveal database structure",
                    "Try different comment syntaxes: --, #, /* */",
                    "Use UNION SELECT to extract data from other tables",
                    "The admin username might be predictable..."
                ],
                "tools": ["Burp Suite", "SQLMap", "Browser Developer Tools"],
                "environment": "Ubuntu Linux with pre-configured vulnerable web application",
                "docker_image": "sqli-lab:latest",
                "tags": "SQL,Database,OWASP,Authentication Bypass",
                "completed": False,
                "featured": True
            },
            {
                "id": str(uuid.uuid4())[:8],
                "title": "XSS Exploitation Basics",
                "category": "web",
                "difficulty": "beginner",
                "time": "30 min",
                "points": 100,
                "participants": 0,
                "description": "Master the fundamentals of Cross-Site Scripting (XSS) attacks.",
                "long_description": """Cross-Site Scripting (XSS) is one of the most common vulnerabilities found in web applications. This lab teaches you how to identify, exploit, and prevent XSS vulnerabilities.

Key topics covered:
• Reflected XSS attacks
• Stored XSS attacks
• DOM-based XSS
• XSS payload construction
• Bypassing basic filters

You'll practice injecting JavaScript into vulnerable pages to understand how attackers can steal cookies, hijack sessions, and manipulate page content.""",
                "objectives": [
                    "Identify XSS vulnerabilities in input fields",
                    "Craft effective XSS payloads",
                    "Steal session cookies using XSS",
                    "Understand different types of XSS",
                    "Learn XSS prevention techniques"
                ],
                "prerequisites": [
                    "Basic HTML knowledge",
                    "JavaScript fundamentals",
                    "Understanding of how browsers work"
                ],
                "hints": [
                    "Try simple payloads like <script>alert(1)</script> first",
                    "Look for input fields that reflect user data",
                    "Check if the application filters certain tags or keywords",
                    "Try encoding your payload to bypass filters",
                    "Use event handlers like onerror or onload for alternative injection points"
                ],
                "tools": ["Browser Developer Tools", "XSS Hunter", "Burp Suite"],
                "environment": "Vulnerable web application with multiple XSS injection points",
                "docker_image": "xss-lab:latest",
                "tags": "XSS,JavaScript,Web Security,OWASP",
                "completed": False,
                "featured": True
            },
            {
                "id": str(uuid.uuid4())[:8],
                "title": "Caesar Cipher Challenge",
                "category": "crypto",
                "difficulty": "beginner",
                "time": "20 min",
                "points": 75,
                "participants": 0,
                "description": "Decode messages encrypted with the classical Caesar cipher.",
                "long_description": """The Caesar cipher is one of the oldest known encryption techniques. Named after Julius Caesar, who used it for military communications, this substitution cipher shifts each letter by a fixed number of positions in the alphabet.

In this lab, you'll:
• Understand the Caesar cipher algorithm
• Learn frequency analysis techniques
• Decrypt messages without knowing the key
• Explore the weaknesses of substitution ciphers
• Use automated tools for cryptanalysis

While simple by modern standards, understanding classical ciphers builds a foundation for more advanced cryptography concepts.""",
                "objectives": [
                    "Understand the Caesar cipher mechanism",
                    "Perform manual decryption",
                    "Use frequency analysis to break the cipher",
                    "Automate decryption with scripts",
                    "Recognize when Caesar cipher is used"
                ],
                "prerequisites": [
                    "Basic understanding of alphabets and shifting",
                    "No programming required but helpful"
                ],
                "hints": [
                    "English text has predictable letter frequencies - 'E' is most common",
                    "Try all 26 possible shifts systematically",
                    "Look for common words like THE, AND, OF",
                    "Write a simple script to automate all rotations",
                    "ROT13 is a special case of Caesar cipher with shift of 13"
                ],
                "tools": ["Python", "Online cipher tools", "Frequency analysis tools"],
                "environment": "Command-line environment with encrypted messages",
                "docker_image": "crypto-basics:latest",
                "tags": "Cryptography,Classical,Cipher,Decryption",
                "completed": False,
                "featured": False
            },
            {
                "id": str(uuid.uuid4())[:8],
                "title": "Social Media OSINT",
                "category": "osint",
                "difficulty": "intermediate",
                "time": "60 min",
                "points": 200,
                "participants": 0,
                "description": "Gather intelligence from social media platforms using OSINT techniques.",
                "long_description": """Open Source Intelligence (OSINT) is the art of collecting information from publicly available sources. Social media platforms are treasure troves of data for investigators and security professionals.

This lab teaches you:
• Advanced search techniques for social media
• Geolocation from photos and posts
• Identifying fake accounts and bots
• Building target profiles from public data
• Using OSINT tools and frameworks
• Legal and ethical considerations

You'll learn to piece together information from multiple sources to create comprehensive intelligence reports, a crucial skill for penetration testers and threat analysts.""",
                "objectives": [
                    "Master advanced social media search techniques",
                    "Extract metadata from images and posts",
                    "Identify connections between accounts",
                    "Geo locate targets using available information",
                    "Compile comprehensive OSINT reports"
                ],
                "prerequisites": [
                    "Understanding of social media platforms",
                    "Basic research skills",
                    "Familiarity with search engines"
                ],
                "hints": [
                    "Use advanced operators in search engines (site:, inurl:, etc.)",
                    "Check image metadata with ExifTool",
                    "Look for username reuse across platforms",
                    "Time zones in posts can reveal actual locations",
                    "Wayback Machine can show deleted content"
                ],
                "tools": ["Maltego", "theHarvester", "ExifTool", "Google Dorking"],
                "environment": "Web-based investigation scenario with simulated social media data",
                "docker_image": "osint-lab:latest",
                "tags": "OSINT,Investigation,Social Media,Intelligence",
                "completed": False,
                "featured": False
            },
            {
                "id": str(uuid.uuid4())[:8],
                "title": "Memory Forensics Analysis",
                "category": "forensics",
                "difficulty": "advanced",
                "time": "90 min",
                "points": 350,
                "participants": 0,
                "description": "Analyze memory dumps to uncover evidence of malicious activity.",
                "long_description": """Memory forensics is a critical skill for incident responders and forensic analysts. RAM contains volatile data that can reveal running processes, network connections, encryption keys, and evidence that might
not exist on disk.

In this advanced lab, you'll:
• Analyze memory dumps using Volatility
• Identify malicious processes
• Extract credentials and encryption keys
• Reconstruct network connections
• Detect rootkits and hidden processes
• Timeline analysis from memory artifacts

You'll be given a memory dump from a compromised system and must piece together what happened, when, and how the attacker operated.""",
                "objectives": [
                    "Master Volatility framework for memory analysis",
                    "Identify indicators of compromise in memory",
                    "Extract passwords and encryption keys",
                    "Reconstruct attacker activities",
                    "Create forensic timeline from memory data"
                ],
                "prerequisites": [
                    "Understanding of operating system internals",
                    "Familiarity with command line tools",
                    "Basic knowledge of malware behavior"
                ],
                "hints": [
                    "Start with 'pslist' to see running processes",
                    "Compare 'pslist' with 'psscan' to find hidden processes",
                    "Use 'netscan' to identify network connections",
                    "Check 'malfind' for injected code",
                    "Look for suspicious DLLs and parent-child process relationships"
                ],
                "tools": ["Volatility", "Rekall", "Windows Sysinternals", "HxD Hex Editor"],
                "environment": "Windows memory dump from compromised system", 
                "docker_image": "forensics-memory:latest",
                "tags": "Forensics,Memory Analysis,Incident Response,Malware",
                "completed": False,
                "featured": True
            },
            {
                "id": str(uuid.uuid4())[:8],
                "title": "Binary Exploitation: Buffer Overflow",
                "category": "reverse",
                "difficulty": "expert",
                "time": "120 min",
                "points": 500,
                "participants": 0,
                "description": "Exploit a buffer overflow vulnerability to gain control of program execution.",
                "long_description": """Buffer overflow is a classic vulnerability that remains relevant today. This expert-level lab teaches you how to exploit memory corruption bugs to achieve code execution.

Advanced topics covered:
• Stack-based buffer overflows
• Return address manipulation
• Shellcode development
• Bypassing ASLR and DEP
• Return-oriented programming (ROP)
• Exploit development process

You'll reverse engineer a vulnerable binary, craft a working exploit, and gain shell access by overwriting the return address and executing your shellcode. This lab requires deep understanding of assembly, memory layout, and exploitation techniques.""",
                "objectives": [
                    "Analyze binary to find vulnerability",
                    "Calculate exact offset to return address",
                    "Develop working shellcode",
                    "Bypass modern security mitigations",
                    "Achieve code execution and get shell"
                ],
                "prerequisites": [
                    "Strong understanding of x86/x64 assembly",
                    "Knowledge of C programming and memory layout",
                    "Familiarity with GDB or similar debuggers",
                    "Understanding of stack frames and calling conventions"
                ],
                "hints": [
                    "Use a cyclic pattern to find the offset",
                    "Remember to account for bad characters in shellcode",
                    "NOP sled can help with shellcode alignment",
                    "Check if NX is enabled - you might need ROP",
                    "pwntools can help automate exploit development"
                ],
                "tools": ["GDB with PEDA", "pwntools", "ROPgadget", "radare2"],
                "environment": "32-bit Linux binary with stack buffer overflow",
                "docker_image": "pwn-bof:latest",
                "tags": "Binary Exploitation,Buffer Overflow,Shellcode,Pwn",
                "completed": False,
                "featured": True
            }
        ]
        
        for lab_data in labs_data:
            # Convert arrays to JSON strings for storage
            lab = Lab(
                id=lab_data["id"],
                title=lab_data["title"],
                category=lab_data["category"],
                difficulty=lab_data["difficulty"],
                time=lab_data["time"],
                points=lab_data["points"],
                participants=lab_data["participants"],
                description=lab_data["description"],
                long_description=lab_data.get("long_description"),
                objectives=json.dumps(lab_data.get("objectives", [])),
                prerequisites=json.dumps(lab_data.get("prerequisites", [])),
                hints=json.dumps(lab_data.get("hints", [])),
                tools=json.dumps(lab_data.get("tools", [])),
                environment=lab_data.get("environment"),
                docker_image=lab_data["docker_image"],
                tags=lab_data["tags"],
                completed=lab_data["completed"],
                featured=lab_data["featured"]
            )
            db.add(lab)
        
        db.commit()
        print(f"✅ Successfully seeded {len(labs_data)} labs!")
        print("\nLabs created:")
        for i, lab in enumerate(labs_data, 1):
            print(f"   {i}. {lab['title']} ({lab['difficulty']}) - {lab['points']} points")
        
    except Exception as e:
        print(f"❌ Error seeding labs: {e}")
        db.rollback()
    finally:
        db.close()

if __name__ == "__main__":
    seed_labs()

"""
Email utilities for sending welcome emails to new users
"""
from django.core.mail import send_mail
from django.conf import settings
from django.template.loader import render_to_string
from django.utils.html import strip_tags
from django.conf import settings

def send_welcome_email(user):
    """
    Send a welcome email to a new user
    """
    subject = "Welcome to FitWell - Your Fitness Journey Begins!"
    
    # Create HTML email content
    html_message = f"""
    <!DOCTYPE html>
    <html>
    <head>
        <style>
            body {{
                font-family: Arial, sans-serif;
                line-height: 1.6;
                color: #333;
            }}
            .container {{
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
                background-color: #f9f9f9;
                border-radius: 10px;
            }}
            .header {{
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 30px;
                text-align: center;
                border-radius: 10px 10px 0 0;
            }}
            .content {{
                padding: 30px;
                background: white;
            }}
            .button {{
                display: inline-block;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 12px 30px;
                text-decoration: none;
                border-radius: 25px;
                font-weight: bold;
                margin: 20px 0;
            }}
            .footer {{
                background: #f4f4f4;
                padding: 20px;
                text-align: center;
                color: #666;
                font-size: 12px;
            }}
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>Welcome to FitWell! 🎉</h1>
            </div>
            <div class="content">
                <h2>Hello {user.first_name or user.email}!</h2>
                <p>Welcome to FitWell! We're thrilled to have you on board.</p>
                <p>Your journey to better health and fitness starts now!</p>
                
                <p>With FitWell, you can:</p>
                <ul>
                    <li>Track your workouts and progress</li>
                    <li>Get personalized meal plans</li>
                    <li>Track your nutrition and water intake</li>
                    <li>Monitor your fitness goals</li>
                    <li>Get AI-powered workout and marathon recommendations</li>
                </ul>
                
                <p>Get started by completing your profile and setting your fitness goals!</p>
                
                <a href="https://yourapp.com/dashboard" class="button">Get Started</a>
                
                <p>If you have any questions, feel free to reply to this email or check out our FAQ.</p>
                
                <p>Best regards,<br>The FitWell Team</p>
            </div>
            <div class="footer">
                <p>You're receiving this email because you signed up for FitWell.</p>
                <p>© 2026 FitWell. All rights reserved.</p>
            </div>
        </div>
    </body>
    </html>
    """
    
    # Plain text version for email clients that don't support HTML
    text_message = f"""
    Welcome to FitWell, {user.first_name or user.email}!
    
    We're excited to have you on board! FitWell helps you track your fitness journey, 
    get personalized workout plans, and achieve your health goals.
    
    Get started by completing your profile and setting your fitness goals.
    
    If you have any questions, feel free to reply to this email.
    
    Best regards,
    The FitWell Team
    """
    
    try:
        send_mail(
            subject=subject,
            message=text_message,
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[user.email],
            html_message=html_message,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
        return False
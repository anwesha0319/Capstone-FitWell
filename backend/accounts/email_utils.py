# -*- coding: utf-8 -*-
"""
Simple email utilities for sending welcome emails to new users
"""
from django.core.mail import send_mail
from django.conf import settings

def send_welcome_email(user):
    """
    Send a simple welcome email to a new user
    """
    subject = "Welcome to FitWell - Your Fitness Journey Starts Now!"
    
    # Get user name for personalization
    user_name = user.first_name or user.email.split('@')[0]
    
    # Simple text message
    text_message = f"""
WELCOME TO FITWELL! 

Hello {user_name}!

We're thrilled to welcome you to FitWell! You've taken the first step towards a healthier, happier you.

WHAT YOU CAN DO WITH FITWELL:
- AI-powered workout plans tailored to your goals
- Personalized nutrition and meal planning
- Progress tracking and analytics
- Water intake and sleep monitoring
- Health data integration

QUICK START:
1. Open the FitWell app on your device (you're already registered!)
2. Complete your profile for personalized recommendations
3. Set your fitness goals
4. Connect your health data sources
5. Get your first AI-generated plan

Need help? Reply to this email for assistance.

Best regards,
Anwesha
FitWell Team

---
You're receiving this email because you signed up for FitWell.
© 2026 FitWell. All rights reserved.
Unsubscribe: https://fitwell.com/unsubscribe
Privacy Policy: https://fitwell.com/privacy
"""
    
    try:
        send_mail(
            subject=subject,
            message=text_message,
            from_email="anwesha0319@gmail.com",
            recipient_list=[user.email],
            html_message=None,
            fail_silently=False,
        )
        return True
    except Exception as e:
        print(f"Failed to send welcome email: {e}")
        return False
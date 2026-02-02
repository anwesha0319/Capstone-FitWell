import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ImageBackground,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Alert,
  Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import { useTheme } from '../../context/ThemeContext';
import { authAPI } from '../../api/endpoints';

const { width, height } = Dimensions.get('window');

const SignupScreen = ({ navigation }) => {
  const { colors } = useTheme();
  
  // Step 1: Personal Info
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [dateOfBirth, setDateOfBirth] = useState('');
  
  // Step 2: Physical Profile
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [gender, setGender] = useState('');
  
  // Step 3: Fitness Goal
  const [fitnessGoal, setFitnessGoal] = useState('');
  
  // Step 4: Password
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [showPassword2, setShowPassword2] = useState(false);

  const fitnessGoals = [
    { value: 'lose_weight', label: 'Lose Weight', icon: 'scale-bathroom' },
    { value: 'gain_muscle', label: 'Gain Muscle', icon: 'dumbbell' },
    { value: 'maintain', label: 'Maintain Health', icon: 'heart-pulse' },
    { value: 'improve_endurance', label: 'Improve Endurance', icon: 'run' },
  ];

  const handleNext = async () => {
    if (step === 1) {
      if (!firstName || !lastName || !email || !dateOfBirth) {
        Alert.alert('Error', 'Please fill in all personal information');
        return;
      }
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      if (!dateRegex.test(dateOfBirth)) {
        Alert.alert('Error', 'Date of birth must be in format YYYY-MM-DD (e.g., 1995-06-15)');
        return;
      }
      setStep(2);
    } else if (step === 2) {
      if (!height || !weight || !gender) {
        Alert.alert('Error', 'Please fill in all physical profile information');
        return;
      }
      setStep(3);
    } else if (step === 3) {
      if (!fitnessGoal) {
        Alert.alert('Error', 'Please select your fitness goal');
        return;
      }
      setStep(4);
    } else if (step === 4) {
      if (!password || !password2) {
        Alert.alert('Error', 'Please enter and confirm your password');
        return;
      }
      if (password !== password2) {
        Alert.alert('Error', 'Passwords do not match');
        return;
      }
      if (password.length < 8) {
        Alert.alert('Error', 'Password must be at least 8 characters');
        return;
      }
      
      // Create account
      setLoading(true);
      try {
        const username = email.split('@')[0];
        const response = await authAPI.signup({
          email,
          username,
          password,
          password2,
          first_name: firstName,
          last_name: lastName,
          date_of_birth: dateOfBirth,
          height: parseFloat(height),
          weight: parseFloat(weight),
          gender,
          fitness_goal: fitnessGoal,
        });
        
        console.log('Signup successful:', response.data);
        
        // Auto-login after successful signup
        try {
          const loginResponse = await authAPI.login({ email, password });
          const loginData = loginResponse.data;
          
          if (loginData.access) {
            await AsyncStorage.setItem('access_token', loginData.access);
            await AsyncStorage.setItem('refresh_token', loginData.refresh);
            await AsyncStorage.setItem('user', JSON.stringify(loginData.user));
            
            // Navigate directly to main app
            navigation.replace('Main');
          }
        } catch (loginError) {
          console.error('Auto-login error:', loginError);
          // If auto-login fails, show success message and go to login
          Alert.alert('Success', 'Account created successfully! Please login.', [
            { text: 'OK', onPress: () => navigation.navigate('Login') }
          ]);
        }
      } catch (error) {
        console.error('Signup error:', error);
        console.error('Error response:', error.response?.data);
        
        // Extract specific error messages from backend
        let errorMessage = 'Failed to create account';
        if (error.response?.data) {
          const errors = error.response.data;
          if (typeof errors === 'object') {
            // Combine all error messages
            const errorMessages = Object.entries(errors)
              .map(([field, messages]) => {
                const msgArray = Array.isArray(messages) ? messages : [messages];
                return `${field}: ${msgArray.join(', ')}`;
              })
              .join('\n');
            errorMessage = errorMessages || errorMessage;
          } else if (typeof errors === 'string') {
            errorMessage = errors;
          }
        } else if (error.message) {
          errorMessage = error.message;
        }
        
        Alert.alert('Error', errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigation.goBack();
    }
  };

  const renderStep1 = () => (
    <>
      <View style={styles.inputContainer}>
        <Icon name="account-outline" size={20} color="#FFFFFF" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="First Name"
          placeholderTextColor="rgba(26, 15, 46, 0.5)"
          value={firstName}
          onChangeText={setFirstName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="account-outline" size={20} color="#FFFFFF" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Last Name"
          placeholderTextColor="rgba(26, 15, 46, 0.5)"
          value={lastName}
          onChangeText={setLastName}
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="email-outline" size={20} color="#FFFFFF" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor="rgba(26, 15, 46, 0.5)"
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="calendar-outline" size={20} color="#FFFFFF" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Date of Birth (YYYY-MM-DD)"
          placeholderTextColor="rgba(26, 15, 46, 0.5)"
          value={dateOfBirth}
          onChangeText={setDateOfBirth}
        />
      </View>
    </>
  );

  const renderStep2 = () => (
    <>
      <View style={styles.inputContainer}>
        <Icon name="human-male-height" size={20} color="#FFFFFF" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Height (cm)"
          placeholderTextColor="rgba(26, 15, 46, 0.5)"
          value={height}
          onChangeText={setHeight}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.inputContainer}>
        <Icon name="weight-kilogram" size={20} color="#FFFFFF" style={styles.inputIcon} />
        <TextInput
          style={styles.input}
          placeholder="Weight (kg)"
          placeholderTextColor="rgba(26, 15, 46, 0.5)"
          value={weight}
          onChangeText={setWeight}
          keyboardType="numeric"
        />
      </View>

      <View style={styles.genderContainer}>
        <Text style={styles.genderLabel}>Gender</Text>
        <View style={styles.genderButtons}>
          <TouchableOpacity
            style={[styles.genderButton, gender === 'male' && styles.genderButtonActive]}
            onPress={() => setGender('male')}
          >
            <Icon name="gender-male" size={24} color={gender === 'male' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} />
            <Text style={[styles.genderButtonText, gender === 'male' && styles.genderButtonTextActive]}>Male</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.genderButton, gender === 'female' && styles.genderButtonActive]}
            onPress={() => setGender('female')}
          >
            <Icon name="gender-female" size={24} color={gender === 'female' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} />
            <Text style={[styles.genderButtonText, gender === 'female' && styles.genderButtonTextActive]}>Female</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.genderButton, gender === 'other' && styles.genderButtonActive]}
            onPress={() => setGender('other')}
          >
            <Icon name="gender-male-female" size={24} color={gender === 'other' ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'} />
            <Text style={[styles.genderButtonText, gender === 'other' && styles.genderButtonTextActive]}>Other</Text>
          </TouchableOpacity>
        </View>
      </View>
    </>
  );

  const renderStep3 = () => (
    <View style={styles.goalsContainer}>
      <Text style={styles.goalsLabel}>Select Your Fitness Goal</Text>
      <View style={styles.goalsGrid}>
        {fitnessGoals.map((goal) => (
          <TouchableOpacity
            key={goal.value}
            style={[styles.goalCard, fitnessGoal === goal.value && styles.goalCardActive]}
            onPress={() => setFitnessGoal(goal.value)}
          >
            <Icon
              name={goal.icon}
              size={32}
              color={fitnessGoal === goal.value ? '#FFFFFF' : 'rgba(255, 255, 255, 0.6)'}
            />
            <Text style={[styles.goalCardText, fitnessGoal === goal.value && styles.goalCardTextActive]}>
              {goal.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  const renderStep4 = () => {
    const passwordsMatch = password2.length > 0 && password === password2;
    const passwordsDontMatch = password2.length > 0 && password !== password2;
    
    return (
      <>
        <View style={styles.inputContainer}>
          <Icon name="lock-outline" size={20} color="#FFFFFF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="rgba(26, 15, 46, 0.5)"
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!showPassword}
          />
          <TouchableOpacity
            onPress={() => setShowPassword(!showPassword)}
            style={styles.eyeIcon}
          >
            <Icon
              name={showPassword ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        <View style={styles.inputContainer}>
          <Icon name="lock-check-outline" size={20} color="#FFFFFF" style={styles.inputIcon} />
          <TextInput
            style={styles.input}
            placeholder="Confirm Password"
            placeholderTextColor="rgba(26, 15, 46, 0.5)"
            value={password2}
            onChangeText={setPassword2}
            secureTextEntry={!showPassword2}
          />
          <TouchableOpacity
            onPress={() => setShowPassword2(!showPassword2)}
            style={styles.eyeIcon}
          >
            <Icon
              name={showPassword2 ? 'eye-off-outline' : 'eye-outline'}
              size={20}
              color="#FFFFFF"
            />
          </TouchableOpacity>
        </View>

        {/* Password matching indicator */}
        {password2.length > 0 && (
          <View style={styles.passwordMatchContainer}>
            <Icon
              name={passwordsMatch ? 'check-circle' : 'close-circle'}
              size={16}
              color={passwordsMatch ? '#A8F5D0' : '#FFB8E8'}
            />
            <Text style={[
              styles.passwordMatchText,
              { color: passwordsMatch ? '#A8F5D0' : '#FFB8E8' }
            ]}>
              {passwordsMatch ? 'Passwords match ✓' : 'Passwords don\'t match ✗'}
            </Text>
          </View>
        )}

        <Text style={styles.passwordHint}>Password must be at least 8 characters</Text>
      </>
    );
  };

  const stepTitles = [
    'Personal Information',
    'Physical Profile',
    'Fitness Goal',
    'Create Password'
  ];

  return (
    <ImageBackground
      source={require('../../assets/images/backgrounds/auth_bg.jpg')}
      style={styles.container}
      resizeMode="cover"
    >
      <View style={styles.overlay} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={handleBack}
          >
            <Icon name="arrow-left" size={24} color="#FFFFFF" />
          </TouchableOpacity>

          {/* Progress indicator */}
          <View style={styles.progressContainer}>
            {[1, 2, 3, 4].map((s) => (
              <View
                key={s}
                style={[
                  styles.progressDot,
                  s <= step && styles.progressDotActive
                ]}
              />
            ))}
          </View>

          {/* Title */}
          <View style={styles.header}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Step {step} of 4: {stepTitles[step - 1]}</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            {step === 1 && renderStep1()}
            {step === 2 && renderStep2()}
            {step === 3 && renderStep3()}
            {step === 4 && renderStep4()}

            <TouchableOpacity
              style={styles.nextButton}
              onPress={handleNext}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.nextButtonText}>
                  {step === 4 ? 'Create Account' : 'Next'}
                </Text>
              )}
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.loginLink}
              onPress={() => navigation.navigate('Login')}
            >
              <Text style={styles.loginLinkText}>
                Already have an account? <Text style={styles.loginLinkBold}>Sign In</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ImageBackground>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: width,
    height: height,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.65)',
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 30,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 30,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressDotActive: {
    backgroundColor: '#8B5CF6',
  },
  header: {
    marginBottom: 30,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
  },
  form: {
    gap: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#1A0F2E',
    fontWeight: '600',
  },
  eyeIcon: {
    padding: 8,
  },
  genderContainer: {
    marginTop: 8,
  },
  genderLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 12,
    fontWeight: '600',
  },
  genderButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.75)',
  },
  genderButtonActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  genderButtonText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
  },
  genderButtonTextActive: {
    color: '#FFFFFF',
  },
  goalsContainer: {
    marginTop: 8,
  },
  goalsLabel: {
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 16,
    fontWeight: '600',
  },
  goalsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  goalCard: {
    width: '48%',
    aspectRatio: 1.2,
    backgroundColor: 'rgba(255, 255, 255, 0.55)',
    borderRadius: 16,
    borderWidth: 3,
    borderColor: 'rgba(255, 255, 255, 0.75)',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  goalCardActive: {
    backgroundColor: '#8B5CF6',
    borderColor: '#8B5CF6',
  },
  goalCardText: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    textAlign: 'center',
  },
  goalCardTextActive: {
    color: '#FFFFFF',
  },
  passwordHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: -8,
  },
  passwordMatchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: -8,
  },
  passwordMatchText: {
    fontSize: 14,
    fontWeight: '600',
  },
  nextButton: {
    backgroundColor: '#8B5CF6',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginTop: 10,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    alignItems: 'center',
    marginTop: 12,
  },
  loginLinkText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
  },
  loginLinkBold: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
});

export default SignupScreen;

import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { validateEmail, validatePassword } from '@/utils/bankUtils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import { Shield, Check, AlertTriangle, FileImage, User, Mail, Lock, Phone, Home, UserCheck, FileText } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent } from '@/components/ui/card';
import * as THREE from 'three';

const INDIAN_STATES = [
  'Andhra Pradesh', 'Arunachal Pradesh', 'Assam', 'Bihar', 'Chhattisgarh', 'Goa', 'Gujarat', 
  'Haryana', 'Himachal Pradesh', 'Jharkhand', 'Karnataka', 'Kerala', 'Madhya Pradesh', 
  'Maharashtra', 'Manipur', 'Meghalaya', 'Mizoram', 'Nagaland', 'Odisha', 'Punjab', 
  'Rajasthan', 'Sikkim', 'Tamil Nadu', 'Telangana', 'Tripura', 'Uttar Pradesh', 'Uttarakhand', 
  'West Bengal', 'Andaman and Nicobar Islands', 'Chandigarh', 'Dadra and Nagar Haveli and Daman and Diu', 
  'Delhi', 'Jammu and Kashmir', 'Ladakh', 'Lakshadweep', 'Puducherry'
];

const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    aadhaarNo: '',
    photo: '',
    age: '',
    profession: '',
    address: '',
    phoneNumber: '',
    state: '',
    district: '',
    townVillage: '',
    fatherName: ''
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  
  const { register } = useAuth();
  const navigate = useNavigate();
  
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    cube: THREE.Mesh;
    isAnimating: boolean;
  } | null>(null);
  
  useEffect(() => {
    if (!containerRef.current || sceneRef.current) return;
    
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0xf0f8ff);
    
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 5;
    
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(width, height);
    container.appendChild(renderer.domElement);
    
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);
    
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 1);
    scene.add(directionalLight);
    
    const materials = [
      new THREE.MeshStandardMaterial({ color: 0x0A2463 }),
      new THREE.MeshStandardMaterial({ color: 0x3E92CC }),
      new THREE.MeshStandardMaterial({ color: 0xFF7F11 }),
      new THREE.MeshStandardMaterial({ color: 0xD8315B }),
      new THREE.MeshStandardMaterial({ color: 0x1CA078 }),
      new THREE.MeshStandardMaterial({ color: 0xFFD700 })
    ];
    
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const cube = new THREE.Mesh(geometry, materials);
    scene.add(cube);
    
    sceneRef.current = {
      scene,
      camera,
      renderer,
      cube,
      isAnimating: true
    };
    
    const animate = () => {
      if (!sceneRef.current || !sceneRef.current.isAnimating) return;
      
      requestAnimationFrame(animate);
      
      sceneRef.current.cube.rotation.x += 0.005;
      sceneRef.current.cube.rotation.y += 0.01;
      
      sceneRef.current.renderer.render(sceneRef.current.scene, sceneRef.current.camera);
    };
    
    animate();
    
    const handleResize = () => {
      if (!containerRef.current || !sceneRef.current) return;
      
      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;
      
      sceneRef.current.camera.aspect = width / height;
      sceneRef.current.camera.updateProjectionMatrix();
      sceneRef.current.renderer.setSize(width, height);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (sceneRef.current) {
        sceneRef.current.isAnimating = false;
        if (container.contains(sceneRef.current.renderer.domElement)) {
          container.removeChild(sceneRef.current.renderer.domElement);
        }
        sceneRef.current.renderer.dispose();
      }
    };
  }, []);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    if (name === 'firstName' || name === 'lastName') {
      const firstName = name === 'firstName' ? value : formData.firstName;
      const lastName = name === 'lastName' ? value : formData.lastName;
      setFormData({
        ...formData,
        [name]: value,
        username: `${firstName} ${lastName}`.trim()
      });
    } else {
      setFormData({
        ...formData,
        [name]: value
      });
    }
  };
  
  const handleSelectChange = (name: string, value: string) => {
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData({
          ...formData,
          photo: reader.result as string
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  const validateStep = (step: number) => {
    const newErrors: Record<string, string> = {};
    
    if (step === 0) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
      }
      
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }
      
      if (!formData.email.trim()) {
        newErrors.email = "Email is required";
      } else if (!validateEmail(formData.email)) {
        newErrors.email = "Please enter a valid email";
      }
      
      if (!formData.password) {
        newErrors.password = "Password is required";
      } else if (!validatePassword(formData.password)) {
        newErrors.password = "Password must be at least 8 characters with at least one uppercase, one lowercase, and one number";
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = "Passwords do not match";
      }
    } else if (step === 1) {
      if (!formData.aadhaarNo.trim()) {
        newErrors.aadhaarNo = "Aadhaar number is required";
      } else if (formData.aadhaarNo.length !== 12 || !/^\d+$/.test(formData.aadhaarNo)) {
        newErrors.aadhaarNo = "Aadhaar number must be 12 digits";
      }
      
      if (!formData.age.trim()) {
        newErrors.age = "Age is required";
      } else if (parseInt(formData.age) < 18) {
        newErrors.age = "You must be at least 18 years old";
      }
      
      if (!formData.profession.trim()) {
        newErrors.profession = "Profession is required";
      }
      
      if (!formData.fatherName.trim()) {
        newErrors.fatherName = "Father's name is required";
      }
    } else if (step === 2) {
      if (!formData.phoneNumber.trim()) {
        newErrors.phoneNumber = "Phone number is required";
      } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
        newErrors.phoneNumber = "Phone number must be 10 digits";
      }
      
      if (!formData.state) {
        newErrors.state = "State is required";
      }
      
      if (!formData.district.trim()) {
        newErrors.district = "District is required";
      }
      
      if (!formData.townVillage.trim()) {
        newErrors.townVillage = "Town/Village is required";
      }
      
      if (!formData.address.trim()) {
        newErrors.address = "Address is required";
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleNextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(currentStep + 1);
    }
  };
  
  const handlePrevStep = () => {
    setCurrentStep(currentStep - 1);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateStep(currentStep)) return;
    
    setIsSubmitting(true);
    try {
      const userData = {
        firstName: formData.firstName,
        lastName: formData.lastName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
        aadhaarNo: formData.aadhaarNo,
        photo: formData.photo,
        age: parseInt(formData.age),
        profession: formData.profession,
        address: formData.address,
        phoneNumber: formData.phoneNumber,
        state: formData.state,
        district: formData.district,
        townVillage: formData.townVillage,
        fatherName: formData.fatherName
      };
      
      await register(userData);
      navigate('/dashboard');
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const renderPasswordStrength = () => {
    if (!formData.password) return null;
    
    const isValid = validatePassword(formData.password);
    
    return (
      <div className="mt-1">
        <div className="flex items-center">
          {isValid ? (
            <Check className="h-4 w-4 text-green-500 mr-1" />
          ) : (
            <AlertTriangle className="h-4 w-4 text-amber-500 mr-1" />
          )}
          <span className={`text-xs ${isValid ? 'text-green-500' : 'text-amber-500'}`}>
            {isValid ? 'Strong password' : 'Password must be at least 8 characters with uppercase, lowercase, and number'}
          </span>
        </div>
      </div>
    );
  };
  
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-1 container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
          <div className="hidden lg:block h-[600px] rounded-xl overflow-hidden bg-gradient-to-br from-blue-50 to-indigo-50 shadow-lg relative">
            <div 
              ref={containerRef} 
              className="w-full h-full"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-white/80 via-transparent to-transparent pointer-events-none" />
            <div className="absolute bottom-0 w-full p-8 text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Welcome to Suryaannarayan Bank</h2>
              <p className="text-gray-600">Your trusted banking partner for generations</p>
            </div>
          </div>
          
          <div className="bg-white p-8 rounded-xl shadow-md">
            <div className="flex justify-center mb-6 lg:hidden">
              <div className="h-16 w-16 bg-bank-blue/10 rounded-full flex items-center justify-center">
                <Shield className="h-8 w-8 text-bank-blue" />
              </div>
            </div>
            
            <h1 className="text-2xl font-bold text-center mb-6">Create Your Account</h1>
            
            <Tabs value={`step-${currentStep}`} className="w-full">
              <TabsList className="grid grid-cols-3 mb-8">
                <TabsTrigger 
                  value="step-0"
                  onClick={() => setCurrentStep(0)}
                  disabled={currentStep < 0}
                  className="data-[state=active]:bg-bank-blue data-[state=active]:text-white"
                >
                  Personal Info
                </TabsTrigger>
                <TabsTrigger 
                  value="step-1"
                  onClick={() => currentStep >= 1 && setCurrentStep(1)}
                  disabled={currentStep < 1}
                  className="data-[state=active]:bg-bank-blue data-[state=active]:text-white"
                >
                  ID & Status
                </TabsTrigger>
                <TabsTrigger 
                  value="step-2"
                  onClick={() => currentStep >= 2 && setCurrentStep(2)}
                  disabled={currentStep < 2}
                  className="data-[state=active]:bg-bank-blue data-[state=active]:text-white"
                >
                  Contact
                </TabsTrigger>
              </TabsList>
              
              <form onSubmit={handleSubmit}>
                <TabsContent value="step-0">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="firstName" className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              First Name
                            </Label>
                            <Input
                              id="firstName"
                              name="firstName"
                              value={formData.firstName}
                              onChange={handleInputChange}
                              className={errors.firstName ? "border-red-500" : ""}
                            />
                            {errors.firstName && (
                              <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="lastName" className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Last Name
                            </Label>
                            <Input
                              id="lastName"
                              name="lastName"
                              value={formData.lastName}
                              onChange={handleInputChange}
                              className={errors.lastName ? "border-red-500" : ""}
                            />
                            {errors.lastName && (
                              <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="email" className="flex items-center gap-1">
                            <Mail className="h-4 w-4" />
                            Email
                          </Label>
                          <Input
                            id="email"
                            name="email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            className={errors.email ? "border-red-500" : ""}
                          />
                          {errors.email && (
                            <p className="text-red-500 text-xs mt-1">{errors.email}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="password" className="flex items-center gap-1">
                            <Lock className="h-4 w-4" />
                            Password
                          </Label>
                          <Input
                            id="password"
                            name="password"
                            type="password"
                            value={formData.password}
                            onChange={handleInputChange}
                            className={errors.password ? "border-red-500" : ""}
                          />
                          {renderPasswordStrength()}
                          {errors.password && (
                            <p className="text-red-500 text-xs mt-1">{errors.password}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="confirmPassword" className="flex items-center gap-1">
                            <Lock className="h-4 w-4" />
                            Confirm Password
                          </Label>
                          <Input
                            id="confirmPassword"
                            name="confirmPassword"
                            type="password"
                            value={formData.confirmPassword}
                            onChange={handleInputChange}
                            className={errors.confirmPassword ? "border-red-500" : ""}
                          />
                          {errors.confirmPassword && (
                            <p className="text-red-500 text-xs mt-1">{errors.confirmPassword}</p>
                          )}
                        </div>
                        
                        <div className="pt-4 text-right">
                          <Button 
                            type="button" 
                            onClick={handleNextStep}
                            className="btn-primary"
                          >
                            Next Step
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="step-1">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="aadhaarNo" className="flex items-center gap-1">
                            <FileText className="h-4 w-4" />
                            Aadhaar Number
                          </Label>
                          <Input
                            id="aadhaarNo"
                            name="aadhaarNo"
                            value={formData.aadhaarNo}
                            onChange={handleInputChange}
                            placeholder="12-digit Aadhaar number"
                            maxLength={12}
                            className={errors.aadhaarNo ? "border-red-500" : ""}
                          />
                          {errors.aadhaarNo && (
                            <p className="text-red-500 text-xs mt-1">{errors.aadhaarNo}</p>
                          )}
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="photo" className="flex items-center gap-1">
                            <FileImage className="h-4 w-4" />
                            Passport Size Photo
                          </Label>
                          <Input
                            id="photo"
                            name="photo"
                            type="file"
                            accept="image/*"
                            onChange={handlePhotoUpload}
                          />
                          {formData.photo && (
                            <div className="mt-2">
                              <img 
                                src={formData.photo} 
                                alt="User preview" 
                                className="h-32 w-32 object-cover border rounded-md" 
                              />
                            </div>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="age" className="flex items-center gap-1">
                              <User className="h-4 w-4" />
                              Age
                            </Label>
                            <Input
                              id="age"
                              name="age"
                              type="number"
                              value={formData.age}
                              onChange={handleInputChange}
                              min="18"
                              className={errors.age ? "border-red-500" : ""}
                            />
                            {errors.age && (
                              <p className="text-red-500 text-xs mt-1">{errors.age}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="profession" className="flex items-center gap-1">
                              <UserCheck className="h-4 w-4" />
                              Profession
                            </Label>
                            <Input
                              id="profession"
                              name="profession"
                              value={formData.profession}
                              onChange={handleInputChange}
                              className={errors.profession ? "border-red-500" : ""}
                            />
                            {errors.profession && (
                              <p className="text-red-500 text-xs mt-1">{errors.profession}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="fatherName" className="flex items-center gap-1">
                            <User className="h-4 w-4" />
                            Father's Name
                          </Label>
                          <Input
                            id="fatherName"
                            name="fatherName"
                            value={formData.fatherName}
                            onChange={handleInputChange}
                            className={errors.fatherName ? "border-red-500" : ""}
                          />
                          {errors.fatherName && (
                            <p className="text-red-500 text-xs mt-1">{errors.fatherName}</p>
                          )}
                        </div>
                        
                        <div className="pt-4 flex justify-between">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={handlePrevStep}
                          >
                            Previous
                          </Button>
                          <Button 
                            type="button" 
                            onClick={handleNextStep}
                            className="btn-primary"
                          >
                            Next Step
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="step-2">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="phoneNumber" className="flex items-center gap-1">
                            <Phone className="h-4 w-4" />
                            Phone Number
                          </Label>
                          <Input
                            id="phoneNumber"
                            name="phoneNumber"
                            value={formData.phoneNumber}
                            onChange={handleInputChange}
                            placeholder="10-digit mobile number"
                            maxLength={10}
                            className={errors.phoneNumber ? "border-red-500" : ""}
                          />
                          {errors.phoneNumber && (
                            <p className="text-red-500 text-xs mt-1">{errors.phoneNumber}</p>
                          )}
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="state" className="flex items-center gap-1">
                              <Home className="h-4 w-4" />
                              State
                            </Label>
                            <Select
                              value={formData.state}
                              onValueChange={(value) => handleSelectChange('state', value)}
                            >
                              <SelectTrigger 
                                id="state"
                                className={errors.state ? "border-red-500" : ""}
                              >
                                <SelectValue placeholder="Select state" />
                              </SelectTrigger>
                              <SelectContent>
                                {INDIAN_STATES.map((state) => (
                                  <SelectItem key={state} value={state}>
                                    {state}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            {errors.state && (
                              <p className="text-red-500 text-xs mt-1">{errors.state}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="district" className="flex items-center gap-1">
                              <Home className="h-4 w-4" />
                              District
                            </Label>
                            <Input
                              id="district"
                              name="district"
                              value={formData.district}
                              onChange={handleInputChange}
                              className={errors.district ? "border-red-500" : ""}
                            />
                            {errors.district && (
                              <p className="text-red-500 text-xs mt-1">{errors.district}</p>
                            )}
                          </div>
                          
                          <div className="space-y-2">
                            <Label htmlFor="townVillage" className="flex items-center gap-1">
                              <Home className="h-4 w-4" />
                              Town/Village
                            </Label>
                            <Input
                              id="townVillage"
                              name="townVillage"
                              value={formData.townVillage}
                              onChange={handleInputChange}
                              className={errors.townVillage ? "border-red-500" : ""}
                            />
                            {errors.townVillage && (
                              <p className="text-red-500 text-xs mt-1">{errors.townVillage}</p>
                            )}
                          </div>
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="address" className="flex items-center gap-1">
                            <Home className="h-4 w-4" />
                            Complete Address
                          </Label>
                          <Textarea
                            id="address"
                            name="address"
                            value={formData.address}
                            onChange={handleInputChange}
                            className={errors.address ? "border-red-500" : ""}
                            rows={3}
                          />
                          {errors.address && (
                            <p className="text-red-500 text-xs mt-1">{errors.address}</p>
                          )}
                        </div>
                        
                        <div className="pt-4 flex justify-between">
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={handlePrevStep}
                          >
                            Previous
                          </Button>
                          <Button 
                            type="submit" 
                            className="btn-primary"
                            disabled={isSubmitting}
                          >
                            {isSubmitting ? "Creating Account..." : "Create Account"}
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </form>
            </Tabs>
            
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                Already have an account?{" "}
                <Link to="/login" className="text-bank-blue hover:underline">
                  Log in
                </Link>
              </p>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Register;

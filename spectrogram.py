import numpy as np
import pyaudio
import matplotlib.pyplot as plt
import matplotlib.animation as anim
import math

class Spectrogram:
    def __init__(self, resolution=1):
        self.min = 0.005
        self.max = 100
        self.resolution = resolution #resolution 1 corresponds to 1920x1080
        self.buffer = np.zeros((1280,1280), dtype=int)
        self.buffer_size = 1024
        
        self.pyaudioinstance = pyaudio.PyAudio()
        self.stream = self.pyaudioinstance.open(format=pyaudio.paFloat32,
                                                channels = 1,
                                                rate = 44100,
                                                input = True,
                                                output = False,
                                                frames_per_buffer = self.buffer_size)
        self.stream.start_stream()
        self.figure = plt.figure()
        #self.draw(self.figure)
        
        plt.imshow(np.transpose(self.buffer), cmap="gray")
        
        print(np.shape(self.buffer))
        self.spectrogram = anim.FuncAnimation(self.figure, self.shift, frames=True, interval=1000)
        plt.show()
        
    def draw(self, fig):
        self.spectrogram = anim.FuncAnimation(fig, self.shift, frames=self.buffer, interval=0)#, fargs=self.frame)

    def shift(self, temp):
        try:
            frame = np.fft.rfft(np.frombuffer(self.stream.read(self.buffer_size),dtype=np.float32))
            self.amp = (np.real(frame)**2 + np.imag(frame)**2)#*10/self.buffer_size
        except IOError:
            pass
        self.buffer = np.roll(self.buffer, 1, axis=0)

        self.amp = self.scale(self.amp)
        self.amp = self.transform(self.amp)
        
        self.buffer[-1,:] = self.amp
        print(np.amax(self.amp))
        print(np.amax(self.buffer))
        plt.imshow(np.transpose(self.buffer), cmap="gray")
        
    def scale(self, amp):
        output = np.zeros(np.shape(self.amp), dtype=int)
        for frequency in range(0, np.shape(self.amp)[0]):
            if self.amp[frequency] > self.min:
                output[frequency] = math.ceil(self.amp[frequency] * 255 / self.max)
            else:
                output[frequency] = 0
        return output
        
    def transform(self, amp):
        if self.resolution == 1:
            height = 3
            output = np.zeros(40, dtype=int)
            for frequency in range(100, 500):
                output = np.hstack((output, np.full(height, amp[frequency-1])))
            output = np.hstack((output, np.zeros(40)))
            return output
        else:
            return np.zeros(40+40+1200)
            
        
beep = Spectrogram()
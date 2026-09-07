#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

const char* serverUrl = "http://103.31.204.120:3005/api/water-level";

const int trigPin = 33;
const int echoPin = 35;
const int buzzerPin = 14;

void setup() {
  Serial.begin(115200);

  pinMode(trigPin, OUTPUT);
  pinMode(echoPin, INPUT);
  pinMode(buzzerPin, OUTPUT);
  digitalWrite(buzzerPin, LOW);

  WiFi.begin(ssid, password);
  
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }
  Serial.println("");
  Serial.println(WiFi.localIP());
}

void loop() {
  digitalWrite(trigPin, LOW);
  delayMicroseconds(2);
  digitalWrite(trigPin, HIGH);
  delayMicroseconds(10);
  digitalWrite(trigPin, LOW);

  long duration = pulseIn(echoPin, HIGH);
  float distanceToWater = duration * 0.034 / 2;

  Serial.print(distanceToWater);
  Serial.println(" cm");

  if (distanceToWater > 0 && distanceToWater <= 5.0) {
    for (int i = 0; i < 5; i++) {
      digitalWrite(buzzerPin, HIGH); 
      delay(50);  
      digitalWrite(buzzerPin, LOW);  
      delay(50);  
    }
  } else {
    digitalWrite(buzzerPin, LOW);
  }

  float currentWaterLevel = distanceToWater;
  if (currentWaterLevel < 0) currentWaterLevel = 0;

  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    
    http.begin(serverUrl);
    http.addHeader("Content-Type", "application/json");

    String jsonPayload = "{\"waterLevel\": " + String(currentWaterLevel) + "}";

    int httpResponseCode = http.POST(jsonPayload);

    if (httpResponseCode > 0) {
      Serial.println("Sent");
    } else {
      Serial.print("Error: ");
      Serial.println(httpResponseCode);
    }

    http.end(); 
  }

  delay(1000);
}
import { BASE_URL } from "../config/constants";
  import React, { useEffect, useState } from 'react';
  import {
    View,
    Text,
    ScrollView,
    ActivityIndicator,
    StyleSheet,
    TextInput,
    TouchableOpacity,
    Dimensions
  } from 'react-native';
  import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
  import { LineChart } from 'react-native-chart-kit';
  import { Button, Icon } from 'react-native-elements';
  import { API_TOKEN } from '../config/apiConfig';
  import { Image, Linking } from 'react-native';

  // const BASE_URL = 'http://192.168.1.13:8080';

  // const BASE_URL = 'https://kundli-api-812108926556.asia-south1.run.app';


  const screenWidth = Dimensions.get("window").width;

  function getSeverityExplanation(score) {
    if (score >= 8) return "🚨 High alert: Expect strong emotional shifts or karmic challenges.";
    if (score >= 6) return "⚠️ Moderate risk: Some volatility likely—stay grounded.";
    if (score >= 4) return "🟠 Mild caution: Stay mindful of emotional triggers.";
    if (score >= 2) return "🟢 Mostly stable: Minor fluctuations possible.";
    return "✅ Clear day: Energies are harmonious.";
  }
  

  export default function AstroAlertScreen({ route }) {
    const [loading, setLoading] = useState(true);
    const [data, setData] = useState(null);
    const [question, setQuestion] = useState('');
    const [aiResponse, setAIResponse] = useState('');
    const [recommendedProduct, setRecommendedProduct] = useState(null);
    const userId = route.params?.userId || "testuser";

    useEffect(() => {
      const fetchAstroAlert = async () => {
        try {
          const response = await fetch("${BASE_URL}/api/astro-alert", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${API_TOKEN}`
            },
            body: JSON.stringify({
              user_id: userId,
              date: new Date().toISOString().split("T")[0],
              full: true
            })
          });

          const json = await response.json();
          if (json.error) throw new Error(json.error);
          setData(json);
        } catch (err) {
          console.error("❌ AstroAlert fetch failed:", err);
          setData({
            summary: "Error fetching alert.",
            severity: 0,
            color: "gray",
            premium: false,
            risk_graph: [],
            personal_insight: "",
            remedies: [],
            forecast: []
          });
        } finally {
          setLoading(false);
        }
      };

      fetchAstroAlert();
    }, []);

    const askAI = async () => {
      try {
        setAIResponse("Loading...");
        setRecommendedProduct(null); // Clear previous product card
        const response = await fetch("https://kundli-api-812108926556.asia-south1.run.app/api/ask-ai", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${API_TOKEN}`
          },
          body: JSON.stringify({
            user_id: userId,
            question,
            date: new Date().toISOString().split("T")[0]
          })
        });
    
        const result = await response.json();
    
        // ✅ Set AI reply
        setAIResponse(result.reply || "No response from AI.");
    
        // ✅ Set product directly from backend
        if (result.product) {
          setRecommendedProduct(result.product);
          console.log("✅ Matched Product:", result.product.title);
        } else {
          console.warn("🛑 No matching product returned from backend.");
        }
    
      } catch (e) {
        console.warn("❌ askAI error:", e);
        setAIResponse("Error getting response.");
        setRecommendedProduct(null);
      }
    };
    

    if (loading)
      return (
        <ActivityIndicator size="large" color="#f55" style={{ flex: 1, justifyContent: 'center' }} />
      );

    const { summary, severity, premium, risk_graph, personal_insight, remedies, forecast } = data;

    return (
      <KeyboardAwareScrollView style={styles.container} enableOnAndroid extraScrollHeight={100}>
        <View style={styles.alertCard}>
          <Text style={styles.title}>🌑 AstroAlert</Text>
          <Text style={styles.sub}>{summary}</Text>
          <Text style={styles.severity}>Severity: {severity}/10</Text>
          <Text style={styles.severityNote}>
            {getSeverityExplanation(severity)}
          </Text>

        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hourly Risk</Text>

          {premium && risk_graph.length ? (
            <>
              <View style={{ paddingHorizontal: 0 }}>
                <LineChart
                  data={{
                    labels: ["00", "04", "08", "12", "16", "20", "24"],
                    datasets: [{ data: risk_graph }]
                  }}
                  width={screenWidth - 75}
                  height={180}
                  chartConfig={{
                    backgroundColor: "#ff6",
                    backgroundGradientFrom: "#f66",
                    backgroundGradientTo: "#f00",
                    decimalPlaces: 1,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`
                  }}
                  style={{
                    borderRadius: 10,
                    marginBottom: 12,
                    alignSelf: 'center'
                  }}
                />
          </View>

      {/* ✅ Explanation text below chart */}
      <Text style={styles.chartExplanation}>
        This chart shows emotional sensitivity across the day based on Moon’s transit. 
        Avoid intense decisions during peaks and plan calm tasks in lower zones.
      </Text>
        </>
      ) : (
        <Text style={styles.locked}>🔒 Locked — Subscribe to Unlock</Text>
      )}
    </View>



        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Personalized Insight</Text>
          <Text style={styles.text}>{premium ? personal_insight : "🔒 Subscribe to view full advice"}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Remedies</Text>
          {premium && remedies.length ? (
            remedies.map((r, idx) => <Text key={idx} style={styles.bullet}>• {r}</Text>)
          ) : (
            <Text style={styles.text}>🔒 Upgrade for personalized rituals & mantras</Text>
          )}
        </View>

        {premium && forecast.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>3-Day Forecast</Text>
          {forecast.map((item, idx) => {
            const moodMap = {
              "Clean day": "🟢 Balanced",
              "Moon–Rahu conjunction": "🔴 Foggy",
              "Moon–Saturn conjunction": "🟠 Low Energy",
              "Moon in Birth Nakshatra": "🔵 Sensitive",
              "Moon in 8th/12th house": "🟡 Vulnerable"
            };
            const mood = moodMap[item.alert] || "🟣 Mixed";
            return (
              <Text key={idx} style={styles.bullet}>
                {item.date} — {item.alert} {mood}
              </Text>
            );
          })}

          <Text style={styles.askHook}>
            ✨ Curious what tomorrow means for your money, love life, or energy?{"\n"}
            🤖 <Text style={{ textDecorationLine: 'underline' }}>Ask AstroAI to decode it →</Text>
          </Text>
        </View>
      )}


        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ask AstroAI</Text>
          <TextInput
            placeholder="Ask about today's emotions, moon, etc."
            style={styles.input}
            value={question}
            onChangeText={setQuestion}
            placeholderTextColor="#888"
          />
          <TouchableOpacity onPress={askAI} style={styles.askButton}>
            <Text style={{ color: '#fff', fontWeight: 'bold' }}>Ask Now</Text>
          </TouchableOpacity>
          {aiResponse ? <Text style={styles.text}>{aiResponse}</Text> : null}
          {recommendedProduct && (
          <View style={styles.productCard}>
            <Text style={styles.sectionTitle}>🔮 Recommended for You</Text>
            {recommendedProduct.image?.src && (
              <Image
                source={{ uri: recommendedProduct.image.src }}
                style={styles.productImage}
                resizeMode="contain"
              />
            )}
            <Text style={styles.productTitle}>{recommendedProduct.title}</Text>

            <Text style={styles.productPrice}>₹{recommendedProduct.variants?.[0]?.price}</Text>
            <Text style={styles.productDesc}>
              {recommendedProduct.body_html?.replace(/<[^>]+>/g, '').slice(0, 80)}...
            </Text>
            <TouchableOpacity
              style={styles.buyButton}
              onPress={() => {
                const variantId = recommendedProduct.variants?.[0]?.id;
                const checkoutUrl = `https://kundlisutra.myshopify.com/cart/${variantId}:1`;
                if (variantId) {
                  Linking.openURL(checkoutUrl);
                }
              }}
            >
              <Text style={styles.buyText}>Buy Now</Text>
            </TouchableOpacity>
          </View>
        )}

        </View>

        {!premium && (
          <View style={styles.subscribeBox}>
            <Button
              title="Upgrade to Premium"
              icon={<Icon name="lock" type="font-awesome" color="white" />}
              buttonStyle={{ backgroundColor: "#d22" }}
              onPress={() => {
                // TODO: navigate to purchase screen
              }}
            />
          </View>
        )}
      </KeyboardAwareScrollView>
    );
  }

  const styles = StyleSheet.create({
    container: { flex: 1, padding: 16, backgroundColor: "#220000" },
    alertCard: {
      backgroundColor: "#440000",
      padding: 20,
      borderRadius: 12,
      marginBottom: 20
    },
    title: { color: "white", fontSize: 22, fontWeight: "bold" },
    sub: { color: "#ffccaa", marginTop: 4 },
    severity: { color: "#ff6666", fontWeight: "bold", marginTop: 6 },
    section: {
      backgroundColor: "#330000",
      padding: 16,
      borderRadius: 12,
      marginBottom: 16
    },
    sectionTitle: { color: "#ff9999", fontSize: 16, fontWeight: "bold", marginBottom: 8 },
    text: { color: "white", fontSize: 15 },
    bullet: { color: "white", fontSize: 15, marginVertical: 2 },
    locked: { color: "#aaa", fontStyle: "italic" },
    subscribeBox: {
      marginVertical: 20,
      padding: 10,
      backgroundColor: "#440000",
      borderRadius: 10
    },
    input: {
      backgroundColor: "#fff",
      padding: 10,
      borderRadius: 8,
      marginBottom: 8,
      color: "black"
    },
    askButton: {
      backgroundColor: "#AA3344",
      padding: 10,
      borderRadius: 8,
      alignItems: 'center',
      marginBottom: 8
    },
    chartExplanation: {
      color: "#eee",
      fontSize: 13,
      fontStyle: "italic",
      marginTop: 8
    },
    askHook: {
      color: "#ffccdd",
      fontSize: 14,
      fontStyle: "italic",
      marginTop: 12
    },
    severityNote: {
      color: "#FFCCCC",
      fontSize: 13,
      fontStyle: "italic",
      marginTop: 4
    },
    productCard: {
      marginTop: 10,
      padding: 12,
      borderRadius: 10,
      backgroundColor: "#552222",
      alignItems: "center",
    },
    productTitle: {
      fontSize: 17,
      color: "white",
      fontWeight: "bold",
      textAlign: "center",
      marginVertical: 4
    },
    productPrice: {
      color: "#00FFAA",
      fontSize: 16,
      fontWeight: "bold",
    },
    productDesc: {
      color: "#ddd",
      fontSize: 14,
      marginVertical: 4,
      textAlign: "center"
    },
    buyButton: {
      backgroundColor: "#ff4444",
      paddingVertical: 8,
      paddingHorizontal: 20,
      borderRadius: 6,
      marginTop: 8
    },
    buyText: {
      color: "white",
      fontWeight: "bold"
    },
    productImage: {
      width: 120,
      height: 120,
      borderRadius: 8,
      marginBottom: 8
    }      
  });

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Star } from 'lucide-react-native';
import { COLORS, FONT_SIZE } from '@/lib/theme';

interface StarRatingProps {
  rating: number;
  maxStars?: number;
  size?: number;
  showValue?: boolean;
  reviewCount?: number;
}

export function StarRating({ rating, maxStars = 5, size = 14, showValue = true, reviewCount }: StarRatingProps) {
  return (
    <View style={styles.container}>
      {Array.from({ length: maxStars }).map((_, i) => {
        const filled = i < Math.floor(rating);
        const half = !filled && i < rating;
        return (
          <Star
            key={i}
            size={size}
            color={filled || half ? '#F59E0B' : 'rgba(255,255,255,0.2)'}
            fill={filled ? '#F59E0B' : 'none'}
          />
        );
      })}
      {showValue && (
        <Text style={[styles.value, { fontSize: size }]}>
          {(rating || 0).toFixed(1)}
        </Text>
      )}
      {reviewCount !== undefined && (
        <Text style={[styles.count, { fontSize: size - 1 }]}>
          ({reviewCount})
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  value: {
    color: '#F59E0B',
    fontWeight: '700',
    marginLeft: 4,
  },
  count: {
    color: 'rgba(255,255,255,0.4)',
    marginLeft: 2,
  },
});

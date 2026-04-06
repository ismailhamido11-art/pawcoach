import { useEffect, useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/theme';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  onClose: () => void;
  headline?: string;
}

// ─── Comparison data ──────────────────────────────────────────────────────────

const COMPARISON_ROWS = [
  { label: 'Scans alimentaires',   free: '3/jour',      premium: 'Illimités' },
  { label: 'Plans nutrition IA',   free: '1/semaine',   premium: 'Illimités' },
  { label: 'Diagnostics santé',    free: '1/semaine',   premium: 'Illimités' },
  { label: 'Support prioritaire',  free: null,          premium: 'Inclus' },
  { label: 'Historique complet',   free: null,          premium: 'Inclus' },
] as const;

// ─── Component ────────────────────────────────────────────────────────────────

export default function NutritionPaywall({ visible, onClose, headline }: Props) {
  const [billingAnnual, setBillingAnnual] = useState(true);
  const [monthlyPrice, setMonthlyPrice] = useState<string | null>(null);
  const [annualPrice, setAnnualPrice] = useState<string | null>(null);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    if (!visible) return;
    try {
      const Purchases = require('react-native-purchases').default;
      Purchases.getOfferings().then((offerings: any) => {
        const packages = offerings.current?.availablePackages ?? [];
        for (const pkg of packages) {
          const period = pkg.packageType ?? '';
          if (period === 'MONTHLY' || pkg.identifier?.includes('monthly')) {
            setMonthlyPrice(pkg.product.priceString);
          }
          if (period === 'ANNUAL' || pkg.identifier?.includes('annual')) {
            setAnnualPrice(pkg.product.priceString);
          }
        }
        if (!monthlyPrice) setMonthlyPrice('7,99 €/mois');
        if (!annualPrice) setAnnualPrice('59,99 €/an');
      }).catch(() => {
        setMonthlyPrice('7,99 €/mois');
        setAnnualPrice('59,99 €/an');
      });
    } catch {
      setMonthlyPrice('7,99 €/mois');
      setAnnualPrice('59,99 €/an');
    }
  }, [visible]);

  const handleUpgrade = async () => {
    setPurchasing(true);
    try {
      const Purchases = require('react-native-purchases').default;
      const offerings = await Purchases.getOfferings();
      const packages = offerings.current?.availablePackages ?? [];
      const targetType = billingAnnual ? 'ANNUAL' : 'MONTHLY';
      const targetId = billingAnnual ? 'annual' : 'monthly';
      const pkg = packages.find((p: any) =>
        p.packageType === targetType || p.identifier?.includes(targetId)
      ) ?? packages[0];
      if (pkg) {
        await Purchases.purchasePackage(pkg);
        onClose();
      }
    } catch {
      // User cancelled or error — silently ignore
    } finally {
      setPurchasing(false);
    }
  };

  const displayedPrice = billingAnnual
    ? (annualPrice ?? '59,99 €/an')
    : (monthlyPrice ?? '7,99 €/mois');

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
      accessibilityViewIsModal
    >
      <View style={styles.backdrop}>
        <TouchableOpacity
          style={StyleSheet.absoluteFillObject}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Fermer"
          activeOpacity={1}
        />
        <View style={styles.sheet}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            {/* Handle */}
            <View style={styles.handle} />

            {/* Icon */}
            <View style={styles.iconWrapper} accessibilityRole="image">
              <Ionicons name="star" size={28} color={Colors.forest[500]} />
            </View>

            {/* Headline */}
            <Text style={styles.headline} accessibilityRole="header">
              {headline ?? 'Passez Premium'}
            </Text>
            <Text style={styles.subheadline}>
              Accédez aux scans et plans nutrition illimités
            </Text>

            {/* Billing toggle */}
            <View style={styles.toggleRow}>
              <TouchableOpacity
                onPress={() => setBillingAnnual(false)}
                activeOpacity={0.75}
                accessibilityRole="radio"
                accessibilityState={{ selected: !billingAnnual }}
                accessibilityLabel="Mensuel"
                style={[styles.toggleBtn, !billingAnnual && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleLabel, !billingAnnual && styles.toggleLabelActive]}>
                  Mensuel
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => setBillingAnnual(true)}
                activeOpacity={0.75}
                accessibilityRole="radio"
                accessibilityState={{ selected: billingAnnual }}
                accessibilityLabel="Annuel — économisez 37%"
                style={[styles.toggleBtn, billingAnnual && styles.toggleBtnActive]}
              >
                <Text style={[styles.toggleLabel, billingAnnual && styles.toggleLabelActive]}>
                  Annuel
                </Text>
                <View style={styles.popularBadge}>
                  <Text style={styles.popularBadgeText}>Populaire</Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Comparison table */}
            <View style={styles.table}>
              {/* Table header */}
              <View style={[styles.tableRow, styles.tableHeaderRow]}>
                <View style={{ flex: 1 }} />
                <Text style={styles.tableHeaderCell}>Gratuit</Text>
                <Text style={[styles.tableHeaderCell, styles.tableHeaderPremium]}>Premium</Text>
              </View>
              {/* Table rows */}
              {COMPARISON_ROWS.map((row, i) => (
                <View
                  key={row.label}
                  style={[
                    styles.tableRow,
                    i % 2 === 0 ? styles.tableRowEven : null,
                  ]}
                >
                  <Text style={styles.tableRowLabel} numberOfLines={1}>{row.label}</Text>
                  {row.free ? (
                    <Text style={styles.tableCellFree}>{row.free}</Text>
                  ) : (
                    <View style={styles.tableCellIconWrapper}>
                      <Ionicons name="close" size={14} color={Colors.earth[300]} />
                    </View>
                  )}
                  <View style={styles.tableCellPremiumWrapper}>
                    {row.premium ? (
                      <>
                        <Ionicons name="checkmark" size={13} color={Colors.forest[500]} />
                        <Text style={styles.tableCellPremiumText}>{row.premium}</Text>
                      </>
                    ) : null}
                  </View>
                </View>
              ))}
            </View>

            {/* Price */}
            <View style={styles.priceRow}>
              {(monthlyPrice || annualPrice) ? (
                <Text style={styles.priceText}>{displayedPrice}</Text>
              ) : (
                <ActivityIndicator size="small" color={Colors.forest[500]} />
              )}
              {billingAnnual && (
                <Text style={styles.savingsText}>Économisez 37% par rapport au mensuel</Text>
              )}
            </View>

            {/* CTA */}
            <TouchableOpacity
              onPress={handleUpgrade}
              disabled={purchasing}
              activeOpacity={0.85}
              accessibilityRole="button"
              accessibilityLabel={purchasing ? 'Achat en cours' : 'Devenir Premium'}
              accessibilityState={{ disabled: purchasing }}
              style={[styles.ctaBtn, purchasing && styles.ctaBtnDisabled]}
            >
              {purchasing ? (
                <ActivityIndicator size="small" color={Colors.cream} />
              ) : (
                <>
                  <Ionicons name="star" size={18} color={Colors.cream} />
                  <Text style={styles.ctaLabel}>Devenir Premium</Text>
                </>
              )}
            </TouchableOpacity>

            {/* Continue free link */}
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              accessibilityRole="button"
              accessibilityLabel="Continuer en gratuit"
              style={styles.freeLink}
            >
              <Text style={styles.freeLinkText}>Continuer en gratuit</Text>
            </TouchableOpacity>

            {/* Trust badges */}
            <View style={styles.trustRow}>
              <View style={styles.trustBadge}>
                <Ionicons name="close-circle-outline" size={14} color={Colors.muted} />
                <Text style={styles.trustText}>Annulez à tout moment</Text>
              </View>
              <View style={styles.trustBadge}>
                <Ionicons name="lock-closed-outline" size={14} color={Colors.muted} />
                <Text style={styles.trustText}>Paiement sécurisé</Text>
              </View>
            </View>

            {/* Legal */}
            <Text style={styles.legal}>
              Résiliation depuis l'App Store ou Google Play. Renouvellement automatique sauf annulation 24h avant l'échéance.
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    alignItems: 'center',
  },
  handle: {
    width: 36,
    height: 4,
    backgroundColor: Colors.earth[200],
    borderRadius: 2,
    marginTop: 12,
    marginBottom: 20,
  },
  iconWrapper: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.forest[50],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  headline: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.forest[800],
    textAlign: 'center',
    marginBottom: 8,
  },
  subheadline: {
    fontSize: 14,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  // ── Toggle
  toggleRow: {
    flexDirection: 'row',
    backgroundColor: Colors.forest[50],
    borderRadius: 12,
    padding: 4,
    width: '100%',
    marginBottom: 20,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    minHeight: 44,
  },
  toggleBtnActive: {
    backgroundColor: Colors.white,
    shadowColor: Colors.forest[500],
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.muted,
  },
  toggleLabelActive: {
    color: Colors.forest[700],
  },
  popularBadge: {
    backgroundColor: Colors.forest[500],
    borderRadius: 10,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  popularBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.cream,
  },
  // ── Table
  table: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.earth[100],
    marginBottom: 20,
  },
  tableHeaderRow: {
    backgroundColor: Colors.forest[50],
    paddingVertical: 10,
  },
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  tableRowEven: {
    backgroundColor: Colors.parchment[50],
  },
  tableHeaderCell: {
    width: 80,
    fontSize: 12,
    fontWeight: '700',
    color: Colors.muted,
    textAlign: 'center',
  },
  tableHeaderPremium: {
    color: Colors.forest[500],
  },
  tableRowLabel: {
    flex: 1,
    fontSize: 13,
    color: Colors.forest[800],
    fontWeight: '500',
  },
  tableCellFree: {
    width: 80,
    fontSize: 12,
    color: Colors.muted,
    textAlign: 'center',
  },
  tableCellIconWrapper: {
    width: 80,
    alignItems: 'center',
  },
  tableCellPremiumWrapper: {
    width: 80,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 3,
  },
  tableCellPremiumText: {
    fontSize: 12,
    color: Colors.forest[500],
    fontWeight: '600',
  },
  // ── Price
  priceRow: {
    alignItems: 'center',
    marginBottom: 16,
    minHeight: 44,
    justifyContent: 'center',
  },
  priceText: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.forest[700],
  },
  savingsText: {
    fontSize: 12,
    color: Colors.forest[400],
    marginTop: 4,
  },
  // ── CTA
  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: Colors.forest[500],
    borderRadius: 14,
    paddingVertical: 16,
    width: '100%',
    minHeight: 52,
    marginBottom: 12,
  },
  ctaBtnDisabled: {
    opacity: 0.5,
  },
  ctaLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.cream,
  },
  freeLink: {
    paddingVertical: 10,
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  freeLinkText: {
    fontSize: 14,
    color: Colors.muted,
    textDecorationLine: 'underline',
  },
  // ── Trust
  trustRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 12,
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  trustBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  trustText: {
    fontSize: 12,
    color: Colors.muted,
  },
  // ── Legal
  legal: {
    fontSize: 10,
    color: Colors.earth[300],
    textAlign: 'center',
    lineHeight: 14,
  },
});

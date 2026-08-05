import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  brandHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
  },
  brandHeaderIconBox: {
    width: 64,
    height: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  brandHeaderIcon: {
    width: 64,
    height: 64,
  },
  headerTitleMain: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerTitleAccent: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  headerSubTitle: {
    fontSize: 11,
    marginTop: 1,
  },
  container: {
    paddingVertical: 12,
    paddingHorizontal: 20,
  },
  searchBarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
  },
  loaderContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyContainer: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    marginTop: 12,
    fontSize: 14,
    marginBottom: 14,
  },
  retryBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 12,
  },
  retryBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sectionContainer: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    height: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  chevronBtn: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },

  popularList: {
    marginTop: 6,
  },
});

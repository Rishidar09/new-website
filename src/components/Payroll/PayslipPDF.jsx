import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer';

const styles = StyleSheet.create({
    page: {
        padding: 40,
        fontSize: 12,
        fontFamily: 'Helvetica',
        color: '#333',
    },
    header: {
        marginBottom: 30,
        borderBottom: '2 solid #3B82F6',
        paddingBottom: 10,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'baseline',
    },
    companyName: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#111827',
    },
    title: {
        fontSize: 18,
        color: '#6B7280',
        textTransform: 'uppercase',
    },
    infoSection: {
        marginBottom: 30,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
    },
    infoBlock: {
        width: '45%',
    },
    label: {
        fontSize: 10,
        color: '#6B7280',
        marginBottom: 4,
        textTransform: 'uppercase',
    },
    value: {
        fontSize: 12,
        fontWeight: 'bold',
        marginBottom: 8,
    },
    table: {
        display: 'flex',
        flexDirection: 'row',
        gap: 20,
        marginBottom: 40,
    },
    tableCol: {
        flex: 1,
    },
    tableHeader: {
        backgroundColor: '#F9FAFB',
        padding: 8,
        fontSize: 11,
        fontWeight: 'bold',
        borderBottom: '1 solid #E5E7EB',
        marginBottom: 10,
    },
    row: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingVertical: 6,
        borderBottom: '1 solid #F3F4F6',
    },
    summarySection: {
        marginTop: 20,
        borderTop: '1 solid #3B82F6',
        paddingTop: 15,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'flex-end',
    },
    netSalaryBlock: {
        backgroundColor: '#EFF6FF',
        padding: 15,
        borderRadius: 8,
        width: '40%',
    },
    netSalaryValue: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1E40AF',
        marginTop: 5,
    },
    footer: {
        position: 'absolute',
        bottom: 40,
        left: 40,
        right: 40,
        fontSize: 10,
        color: '#9CA3AF',
        textAlign: 'center',
        borderTop: '1 solid #E5E7EB',
        paddingTop: 10,
    }
});

const PayslipPDF = ({ payslip, employee }) => {
    if (!payslip || !employee) return null;

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <View style={styles.header}>
                    <Text style={styles.companyName}>IndusInnovate</Text>
                    <Text style={styles.title}>Payslip</Text>
                </View>

                <View style={styles.infoSection}>
                    <View style={styles.infoBlock}>
                        <Text style={styles.label}>Employee Name</Text>
                        <Text style={styles.value}>{employee.full_name}</Text>
                        <Text style={styles.label}>Designation</Text>
                        <Text style={styles.value}>{employee.role}</Text>
                        <Text style={styles.label}>Department</Text>
                        <Text style={styles.value}>{employee.department}</Text>
                    </View>
                    <View style={styles.infoBlock}>
                        <Text style={styles.label}>Payslip Period</Text>
                        <Text style={styles.value}>{payslip.month} {payslip.year}</Text>
                        <Text style={styles.label}>Employee ID</Text>
                        <Text style={styles.value}>{employee.id.slice(0, 8)}</Text>
                        <Text style={styles.label}>Pay Date</Text>
                        <Text style={styles.value}>{new Date(payslip.created_at).toLocaleDateString()}</Text>
                    </View>
                </View>

                <View style={styles.table}>
                    {/* Earnings */}
                    <View style={styles.tableCol}>
                        <Text style={styles.tableHeader}>EARNINGS</Text>
                        <View style={styles.row}>
                            <Text>Basic Salary</Text>
                            <Text>₹{payslip.basic_salary}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text>HRA</Text>
                            <Text>₹{payslip.hra}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text>Allowances</Text>
                            <Text>₹{payslip.allowances}</Text>
                        </View>
                        <View style={[styles.row, { borderBottom: 0, fontWeight: 'bold', marginTop: 10 }]}>
                            <Text>Gross Earnings</Text>
                            <Text>₹{payslip.gross_salary}</Text>
                        </View>
                    </View>

                    {/* Deductions */}
                    <View style={styles.tableCol}>
                        <Text style={styles.tableHeader}>DEDUCTIONS</Text>
                        <View style={styles.row}>
                            <Text>Provident Fund (PF)</Text>
                            <Text>₹{payslip.pf}</Text>
                        </View>
                        <View style={styles.row}>
                            <Text>TDS / Tax</Text>
                            <Text>₹{payslip.tds}</Text>
                        </View>
                        <View style={[styles.row, { borderBottom: 0, fontWeight: 'bold', marginTop: 10 }]}>
                            <Text>Total Deductions</Text>
                            <Text>₹{payslip.deductions}</Text>
                        </View>
                    </View>
                </View>

                <View style={styles.summarySection}>
                    <View style={styles.netSalaryBlock}>
                        <Text style={styles.label}>Net Take Home</Text>
                        <Text style={styles.netSalaryValue}>₹{payslip.net_salary}</Text>
                    </View>
                </View>

                <Text style={styles.footer}>
                    This is a computer generated document and does not require a signature.
                    IndusInnovate Technologies | www.indusinnovate.com
                </Text>
            </Page>
        </Document>
    );
};

export default PayslipPDF;

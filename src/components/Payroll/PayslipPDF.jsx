import React from 'react';
import { Document, Page, Text, View, StyleSheet, Font, Image } from '@react-pdf/renderer';

// Register fonts
Font.register({
    family: 'Noto Sans',
    src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@master/hinted/ttf/NotoSans/NotoSans-Regular.ttf'
});

Font.register({
    family: 'Noto Sans Bold',
    src: 'https://cdn.jsdelivr.net/gh/googlefonts/noto-fonts@master/hinted/ttf/NotoSans/NotoSans-Bold.ttf'
});

const styles = StyleSheet.create({
    page: {
        padding: '30px',
        fontSize: 10,
        fontFamily: 'Noto Sans',
        color: '#000',
    },
    outerBorder: {
        border: '1.5 solid #000',
        flex: 1,
    },
    // HEADER
    headerRow: {
        display: 'flex',
        flexDirection: 'row',
        padding: '20px 20px',
        alignItems: 'center',
    },
    logoSection: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
    },
    logoImage: {
        width: 140,
        marginBottom: 5,
    },
    tagline: {
        fontSize: 8,
        color: '#666',
        marginLeft: 35, // align slightly right of the mark
    },
    companyAddress: {
        flex: 1,
        textAlign: 'center',
        fontSize: 10,
    },
    // MONTH TITLE
    monthTitle: {
        textAlign: 'center',
        padding: '5px 0',
        borderTop: '1 solid #000',
        borderBottom: '1 solid #000',
        fontFamily: 'Noto Sans Bold',
        fontSize: 12,
    },
    // SECTION TITLE
    sectionTitleRow: {
        textAlign: 'center',
        padding: '4px 0',
        borderBottom: '1 solid #000',
        fontFamily: 'Noto Sans Bold',
        fontSize: 11,
    },
    // GENERIC GRID ROW
    gridRow: {
        display: 'flex',
        flexDirection: 'row',
        borderBottom: '1 solid #000',
    },
    // EMPLOYEE DETAILS GRID
    empLabelCell: {
        width: '15%',
        padding: '4px 6px',
        borderRight: '1 solid #000',
        backgroundColor: '#d9d9d9', // grey background from template
    },
    empValueCell: {
        width: '35%',
        padding: '4px 6px',
        borderRight: '1 solid #000',
        backgroundColor: '#d9d9d9', // dark grey from template
    },
    empLabelCellRight: {
        width: '20%',
        padding: '4px 6px',
        borderRight: '1 solid #000',
        backgroundColor: '#d9d9d9',
    },
    empValueCellRight: {
        width: '30%',
        padding: '4px 6px',
        backgroundColor: '#d9d9d9',
    },
    // EARNINGS / DEDUCTIONS TABLE HEADER
    thContainer: {
        display: 'flex',
        flexDirection: 'row',
        borderBottom: '1 solid #000',
        fontFamily: 'Noto Sans Bold',
        backgroundColor: '#ffffff',
    },
    thEarningLabel: {
        width: '30%',
        padding: '6px',
    },
    thEarningAmount: {
        width: '18%',
        padding: '6px',
        borderRight: '1 solid #000',
        textAlign: 'right',
    },
    thDeductionLabel: {
        width: '32%', // Wider to accommodate "Total Deductions" alignment
        padding: '6px',
    },
    thDeductionAmount: {
        width: '20%',
        padding: '6px',
        textAlign: 'right',
    },
    // TABLE ROWS
    trContainer: {
        display: 'flex',
        flexDirection: 'row',
        borderBottom: '1 solid #000',
    },
    tdEarningLabel: {
        width: '30%',
        padding: '4px 6px',
        borderRight: '1 solid #000',
    },
    tdEarningAmount: {
        width: '18%',
        padding: '4px 6px',
        borderRight: '1 solid #000',
        textAlign: 'right',
    },
    tdDeductionLabel: {
        width: '32%',
        padding: '4px 6px',
        borderRight: '1 solid #000',
    },
    tdDeductionAmount: {
        width: '20%',
        padding: '4px 6px',
        textAlign: 'right',
    },
    // GROSS ROW
    grossRow: {
        display: 'flex',
        flexDirection: 'row',
        borderBottom: '1 solid #000',
        fontFamily: 'Noto Sans Bold',
    },
    grossLabel: {
        width: '30%',
        padding: '4px 6px',
        borderRight: '1 solid #000',
    },
    grossAmount: {
        width: '18%',
        padding: '4px 6px',
        borderRight: '1 solid #000',
        textAlign: 'right',
    },
    totalDeductionLabel: {
        width: '32%',
        padding: '4px 6px',
        borderRight: '1 solid #000',
    },
    totalDeductionAmount: {
        width: '20%',
        padding: '4px 6px',
        textAlign: 'right',
    },
    // NET PAY ROW
    netPayRow: {
        display: 'flex',
        flexDirection: 'row',
        borderBottom: '1 solid #000',
        padding: '6px',
        fontFamily: 'Noto Sans Bold',
    },
    netPayAmount: {
        width: '50%',
        textAlign: 'center',
    },
    // IN WORDS ROW
    inWordsRow: {
        display: 'flex',
        flexDirection: 'row',
        borderBottom: '1 solid #000',
        padding: '4px 6px',
    },
    // FOOTER
    footerContactRow: {
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: '4px 6px',
        borderBottom: '1 solid #000',
    },
    footerLinkBlue: {
        color: '#0ea5e9',
        textDecoration: 'underline',
    },
    footerPhone: {
        color: '#000',
    },
    footerDisclaimer: {
        textAlign: 'center',
        padding: '8px',
        backgroundColor: '#bfbfbf',
        fontSize: 9,
    },
    // WATERMARK
    watermarkContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: -1,
    },
    watermarkImage: {
        width: 350,
        opacity: 0.1,
    }
});

// Utility to convert numbers to words
const numberToWords = (num) => {
    const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    if ((num = num.toString()).length > 9) return 'overflow';
    const n = ('000000000' + num).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n) return;
    let str = '';
    str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore ' : '';
    str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh ' : '';
    str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand ' : '';
    str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred ' : '';
    str += (n[5] != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
    return str.trim();
};

const PayslipPDF = ({ payslip, employee }) => {
    if (!payslip || !employee) return null;

    // Default formatting mappings based on the template
    const empId = `INDUS${String(employee.id).padStart(3, '0').substring(0, 3)}` || "INDUS006";
    const panNo = employee.pan || "BIDPV8596A";
    const processedDays = 31;
    const paidDays = 31;
    const bankAccount = employee.bank_account || "*********0001";
    const bankName = employee.bank_name || "HDFC";

    // Values
    const basic = Number(payslip.basic_salary) || 17500;
    const hra = Number(payslip.hra) || 8750;
    const conveyance = payslip.allowances ? Math.floor(Number(payslip.allowances) * 0.285) : 1500; // split allowance roughly like template
    const specialAllowance = payslip.allowances ? Math.ceil(Number(payslip.allowances) * 0.715) : 3750;
    const grossPay = basic + hra + conveyance + specialAllowance;

    const ptax = 200; // Standard professional tax shown in template
    const otherDeduction = Number(payslip.tds) || 0; // TDS as other deduction for template accuracy
    const totalDeductions = otherDeduction + ptax + (Number(payslip.pf) || 0);

    // Net Pay based strictly on the split above to ensure math is perfect
    const netPay = grossPay - totalDeductions;
    const netWords = numberToWords(netPay);

    return (
        <Document>
            <Page size="A4" style={styles.page}>

                {/* Watermark Logo Component - Behind everything */}
                <View style={styles.watermarkContainer}>
                    <Image style={styles.watermarkImage} src="https://i.imgur.com/Kx9M7Z8.png" />
                </View>

                <View style={styles.outerBorder}>

                    {/* Header */}
                    <View style={styles.headerRow}>
                        <View style={styles.logoSection}>
                            {/* In a real project you'd use your actual logo asset. Using a placeholder or text if unavailable */}
                            <Image style={styles.logoImage} src="https://i.imgur.com/Kx9M7Z8.png" />
                            <Text style={styles.tagline}>Innovating the future, the Indus way.</Text>
                        </View>
                        <Text style={styles.companyAddress}>
                            #206, 2nd floor, Panchsheel Complex,{'\n'}
                            Nizampet, Hyderabad, Telangana,{'\n'}
                            India, 500090
                        </Text>
                    </View>

                    {/* Month Title */}
                    <Text style={styles.monthTitle}>
                        Pay Slip for the Month of {payslip.month} {payslip.year}
                    </Text>

                    {/* Employee Details Title */}
                    <Text style={styles.sectionTitleRow}>Employee Details</Text>

                    {/* Details Grid */}
                    <View style={styles.gridRow}>
                        <Text style={styles.empLabelCell}>Emp ID:</Text>
                        <Text style={styles.empValueCell}>{empId}</Text>
                        <Text style={styles.empLabelCellRight}>Emp Name:</Text>
                        <Text style={styles.empValueCellRight}>{employee.full_name}</Text>
                    </View>
                    <View style={styles.gridRow}>
                        <Text style={styles.empLabelCell}>Designation:</Text>
                        <Text style={styles.empValueCell}>{employee.role}</Text>
                        <Text style={styles.empLabelCellRight}>Pan No:</Text>
                        <Text style={styles.empValueCellRight}>{panNo}</Text>
                    </View>
                    <View style={styles.gridRow}>
                        <Text style={styles.empLabelCell}>Department:</Text>
                        <Text style={styles.empValueCell}>{employee.department || 'IT'}</Text>
                        <Text style={styles.empLabelCellRight}>Processed Days:</Text>
                        <Text style={styles.empValueCellRight}>{processedDays}</Text>
                    </View>
                    <View style={styles.gridRow}>
                        <Text style={styles.empLabelCell}>Location:</Text>
                        <Text style={styles.empValueCell}>{employee.location || 'Hyderabad'}</Text>
                        <Text style={styles.empLabelCellRight}>Paid Days:</Text>
                        <Text style={styles.empValueCellRight}>{paidDays}</Text>
                    </View>
                    <View style={styles.gridRow}>
                        <Text style={styles.empLabelCell}>Bank A/c No:</Text>
                        <Text style={styles.empValueCell}>{bankAccount}</Text>
                        <Text style={styles.empLabelCellRight}>Bank Name:</Text>
                        <Text style={styles.empValueCellRight}>{bankName}</Text>
                    </View>

                    {/* Earnings / Deductions Header */}
                    <View style={styles.thContainer}>
                        <Text style={styles.thEarningLabel}>Earnings</Text>
                        <View style={styles.thEarningAmount}>
                            <Text>Amount(Rs)</Text>
                        </View>
                        <Text style={styles.thDeductionLabel}>Deductions</Text>
                        <Text style={styles.thDeductionAmount}>Amount(Rs)</Text>
                    </View>

                    {/* Table Body */}
                    <View style={styles.trContainer}>
                        <Text style={styles.tdEarningLabel}>Basic</Text>
                        <Text style={styles.tdEarningAmount}>{basic}</Text>
                        <Text style={styles.tdDeductionLabel}>Other Deduction</Text>
                        <Text style={styles.tdDeductionAmount}>{otherDeduction}</Text>
                    </View>
                    <View style={styles.trContainer}>
                        <Text style={styles.tdEarningLabel}>HRA</Text>
                        <Text style={styles.tdEarningAmount}>{hra}</Text>
                        <Text style={styles.tdDeductionLabel}>P Tax</Text>
                        <Text style={styles.tdDeductionAmount}>{ptax}</Text>
                    </View>
                    <View style={styles.trContainer}>
                        <Text style={styles.tdEarningLabel}>Conveyance</Text>
                        <Text style={styles.tdEarningAmount}>{conveyance}</Text>
                        <Text style={styles.tdDeductionLabel}></Text>
                        <Text style={styles.tdDeductionAmount}></Text>
                    </View>
                    <View style={styles.trContainer}>
                        <Text style={styles.tdEarningLabel}>Special Allowance</Text>
                        <Text style={styles.tdEarningAmount}>{specialAllowance}</Text>
                        <Text style={styles.tdDeductionLabel}></Text>
                        <Text style={styles.tdDeductionAmount}></Text>
                    </View>

                    {/* Gross Pay & Total Deductions */}
                    <View style={styles.grossRow}>
                        <Text style={styles.grossLabel}>Gross Pay</Text>
                        <Text style={styles.grossAmount}>{grossPay}</Text>
                        <View style={styles.totalDeductionLabel}>
                            <Text>Total</Text>
                            <Text>Deductions</Text>
                        </View>
                        <View style={[styles.totalDeductionAmount, { justifyContent: 'flex-end', display: 'flex' }]}>
                            <Text>{totalDeductions}</Text>
                        </View>
                    </View>

                    {/* Net Pay */}
                    <View style={styles.netPayRow}>
                        <Text style={{ width: '48%' }}>Net Pay:</Text>
                        <Text style={styles.netPayAmount}>{netPay}</Text>
                    </View>

                    {/* Net Pay in Words */}
                    <View style={styles.inWordsRow}>
                        <Text style={{ fontFamily: 'Noto Sans Bold' }}>Net Pay in words: </Text>
                        <Text>{netWords}</Text>
                    </View>

                    {/* Footer Links */}
                    <View style={styles.footerContactRow}>
                        <Text style={styles.footerLinkBlue}>www.iit.org.in</Text>
                        <Text style={styles.footerLinkBlue}>hr@iit.org.in</Text>
                        <Text style={styles.footerPhone}>+91 9063063679</Text>
                    </View>

                    {/* Disclaimer */}
                    <Text style={styles.footerDisclaimer}>
                        Computer generated document. Signature or seal not required
                    </Text>

                </View>
            </Page>
        </Document>
    );
};

export default PayslipPDF;

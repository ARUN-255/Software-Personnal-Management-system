import { useLayoutEffect, useRef } from 'react';
import { useLanguage } from '../context/LanguageContext';
const tamilText = {
  'Dashboard': 'முகப்பு',
  'My dashboard': 'எனது முகப்பு',
  'A clear view of your people and priorities.': 'உங்கள் ஊழியர்களையும் முன்னுரிமைகளையும் தெளிவாகப் பாருங்கள்.',
  'Everything you need for your workday.': 'உங்கள் வேலை நாளுக்குத் தேவையான அனைத்தும்.',
  'Add employee': 'ஊழியரைச் சேர்',
  'TEAM OVERVIEW': 'குழு மேலோட்டம்',
  'Good to see you.': 'உங்களைப் பார்ப்பதில் மகிழ்ச்சி.',
  'Here’s what’s happening at Bronzera Labs.': 'Bronzera Labs-இன் தற்போதைய நிலை இதோ.',
  'Employees': 'ஊழியர்கள்',
  'Employee': 'ஊழியர்',
  'Pending requests': 'நிலுவையிலுள்ள கோரிக்கைகள்',
  'Published payroll': 'வெளியிடப்பட்ட சம்பளம்',
  'Departments': 'துறைகள்',
  'View directory': 'பட்டியலைப் பார்',
  'Review requests': 'கோரிக்கைகளைப் பரிசீலி',
  'Manage payroll': 'சம்பளத்தை நிர்வகி',
  'Across your organisation': 'உங்கள் நிறுவனம் முழுவதும்',
  'Attendance overview': 'வருகைப் பதிவு மேலோட்டம்',
  'View report': 'அறிக்கையைப் பார்',
  'Needs your attention': 'உங்கள் கவனம் தேவை',
  'Leave and attendance corrections': 'விடுப்பு மற்றும் வருகைத் திருத்தங்கள்',
  'Review and send a reminder': 'பரிசீலித்து நினைவூட்டல் அனுப்பு',
  'Need a quick summary?': 'விரைவான சுருக்கம் வேண்டுமா?',
  'Ask your AI assistant': 'AI உதவியாளரிடம் கேளுங்கள்',
  'People directory': 'ஊழியர் பட்டியல்',
  'View all employees': 'அனைத்து ஊழியர்களையும் பார்',
  'Add your first employee to get started.': 'தொடங்க உங்கள் முதல் ஊழியரைச் சேர்க்கவும்.',
  'Present': 'வருகை',
  'Absent': 'வரவில்லை',
  'Half day': 'அரை நாள்',
  'Holiday': 'விடுமுறை',
  'Attendance': 'வருகைப் பதிவு',
  'Review and update daily records.': 'தினசரி பதிவுகளைப் பார்த்துத் திருத்துங்கள்.',
  'Your time, at a glance.': 'உங்கள் நேர விவரங்கள் ஒரே பார்வையில்.',
  'Check in': 'வருகையைப் பதிவு செய்',
  'Check out': 'வெளியேறும் நேரத்தைப் பதிவு செய்',
  'Add / correct record': 'பதிவைச் சேர் / திருத்து',
  'Completed clock-in sessions': 'முடிந்த வருகைப் பதிவுகள்',
  'Hours worked': 'வேலை செய்த மணிநேரம்',
  'Recorded days only · same-day shifts': 'பதிவான நாட்கள் மட்டும் · ஒரே நாள் பணி நேரம்',
  'Leave & requests': 'விடுப்பு & கோரிக்கைகள்',
  'Review your team’s requests.': 'உங்கள் குழுவின் கோரிக்கைகளைப் பரிசீலிக்கவும்.',
  'Apply for leave or correct an attendance record.': 'விடுப்புக்கு விண்ணப்பிக்கவும் அல்லது வருகைப் பதிவைத் திருத்தவும்.',
  'New request': 'புதிய கோரிக்கை',
  'Request type': 'கோரிக்கை வகை',
  'Leave': 'விடுப்பு',
  'Attendance correction': 'வருகைப் பதிவு திருத்தம்',
  'Start date': 'தொடக்க தேதி',
  'End date': 'முடிவு தேதி',
  'Reason': 'காரணம்',
  'Submit request': 'கோரிக்கையைச் சமர்ப்பி',
  'Review request': 'கோரிக்கையைப் பரிசீலி',
  'Review comment': 'பரிசீலனைக் குறிப்பு',
  'Approve': 'அனுமதி',
  'Reject': 'நிராகரி',
  'Payroll': 'சம்பளம்',
  'Manage salary records and publish payslips.': 'சம்பளப் பதிவுகளை நிர்வகித்து சம்பளச் சீட்டுகளை வெளியிடுங்கள்.',
  'Your salary history and payslips.': 'உங்கள் சம்பள வரலாறும் சம்பளச் சீட்டுகளும்.',
  'Add / update payroll': 'சம்பளத்தைச் சேர் / புதுப்பி',
  'Basic pay': 'அடிப்படை சம்பளம்',
  'Allowances': 'கூடுதல் தொகை',
  'Deductions': 'பிடித்தங்கள்',
  'Net pay': 'நிகர சம்பளம்',
  'Pay period': 'சம்பள மாதம்',
  'Download PDF': 'PDF பதிவிறக்கு',
  'Save payroll': 'சம்பளத்தைச் சேமி',
  'Publish payslip for the employee': 'ஊழியருக்குச் சம்பளச் சீட்டை வெளியிடு',
  'My documents': 'எனது ஆவணங்கள்',
  'Photos and certificates shared by your administrator.': 'நிர்வாகி பகிர்ந்த புகைப்படங்களும் சான்றிதழ்களும்.',
  'Open document': 'ஆவணத்தைத் திற',
  'Reports': 'அறிக்கைகள்',
  'Monthly totals, clearly presented.': 'மாதாந்திர மொத்தங்கள் தெளிவாக வழங்கப்பட்டுள்ளன.',
  'Recorded attendance': 'பதிவான வருகை',
  'Present days': 'வருகை நாட்கள்',
  'Published net pay': 'வெளியிடப்பட்ட நிகர சம்பளம்',
  'Recorded days': 'பதிவான நாட்கள்',
  'Attendance breakdown': 'வருகைப் பதிவு விவரம்',
  'Export CSV': 'CSV ஏற்றுமதி',
  'Print report': 'அறிக்கையை அச்சிடு',
  'Missing certificates': 'சமர்ப்பிக்காத சான்றிதழ்கள்',
  'Send reminder': 'நினைவூட்டல் அனுப்பு',
  'Notifications': 'அறிவிப்புகள்',
  'Updates that need your attention.': 'உங்கள் கவனம் தேவைப்படும் புதுப்பிப்புகள்.',
  'Mark read': 'படித்ததாகக் குறி',
  'New updates will appear here.': 'புதிய புதுப்பிப்புகள் இங்கே தோன்றும்.',
  'Audit history': 'தணிக்கை வரலாறு',
  'The latest 100 successful changes.': 'சமீபத்திய 100 வெற்றிகரமான மாற்றங்கள்.',
  'Account security': 'கணக்கு பாதுகாப்பு',
  'Keep your login details up to date.': 'உங்கள் உள்நுழைவு விவரங்களைப் புதுப்பித்து வைத்திருங்கள்.',
  'Current password': 'தற்போதைய கடவுச்சொல்',
  'New password': 'புதிய கடவுச்சொல்',
  'Confirm new password': 'புதிய கடவுச்சொல்லை உறுதிப்படுத்து',
  'Change password': 'கடவுச்சொல்லை மாற்று',
  'Employees': 'ஊழியர்கள்',
  'Your people, all in one place.': 'உங்கள் ஊழியர்கள் அனைவரும் ஒரே இடத்தில்.',
  'Department': 'துறை',
  'Role': 'பதவி',
  'Status': 'நிலை',
  'View profile': 'சுயவிவரத்தைப் பார்',
  'Previous': 'முந்தையது',
  'Next': 'அடுத்தது',
  'Employee profile': 'ஊழியர் சுயவிவரம்',
  'All employees': 'அனைத்து ஊழியர்கள்',
  'Edit profile': 'சுயவிவரத்தைத் திருத்து',
  'Personal details': 'தனிப்பட்ட விவரங்கள்',
  'Photos & certificates': 'புகைப்படங்கள் & சான்றிதழ்கள்',
  'Upload a document': 'ஆவணத்தைப் பதிவேற்று',
  'Profile photo': 'சுயவிவரப் புகைப்படம்',
  'Certificate': 'சான்றிதழ்',
  'Choose a file': 'கோப்பைத் தேர்ந்தெடு',
  'Upload file': 'கோப்பைப் பதிவேற்று',
  'Title': 'தலைப்பு',
  'File type': 'கோப்பு வகை',
  'Payroll & payslips': 'சம்பளம் & சம்பளச் சீட்டுகள்',
  'Email': 'மின்னஞ்சல்',
  'Phone': 'தொலைபேசி',
  'Address': 'முகவரி',
  'Joined': 'சேர்ந்த தேதி',
  'Days present': 'வருகை நாட்கள்',
  'Your workday': 'உங்கள் வேலை நாள்',
  'My requests': 'எனது கோரிக்கைகள்',
  'View all': 'அனைத்தையும் பார்',
  'No requests yet.': 'இதுவரை கோரிக்கைகள் இல்லை.',
  'My details': 'எனது விவரங்கள்',
  'Open attendance': 'வருகைப் பதிவைத் திற',
  'Open documents': 'ஆவணங்களைத் திற',
  'Loading…': 'ஏற்றுகிறது…',
  'Try again': 'மீண்டும் முயற்சி',
  "We couldn't load this page": 'இந்தப் பக்கத்தை ஏற்ற முடியவில்லை',
  'Choose an employee': 'ஊழியரைத் தேர்ந்தெடு',
  'Date': 'தேதி',
  'Notes': 'குறிப்புகள்',
  'Save attendance': 'வருகைப் பதிவைச் சேமி'
};
const months = {
  January: 'ஜனவரி',
  February: 'பிப்ரவரி',
  March: 'மார்ச்',
  April: 'ஏப்ரல்',
  May: 'மே',
  June: 'ஜூன்',
  July: 'ஜூலை',
  August: 'ஆகஸ்ட்',
  September: 'செப்டம்பர்',
  October: 'அக்டோபர்',
  November: 'நவம்பர்',
  December: 'டிசம்பர்'
};
function translate(value) {
  const trimmed = value.trim();
  if (!trimmed) return value;
  let result = tamilText[trimmed];
  if (!result) {
    result = trimmed.replace(/^(January|February|March|April|May|June|July|August|September|October|November|December)( \d{4})/, (_, month, year) => `${months[month]}${year}`).replace(/(\d+) recorded days/g, '$1 பதிவான நாட்கள்').replace(/(\d+) pending requests/g, '$1 நிலுவைக் கோரிக்கைகள்').replace(/(\d+) missing certificates/g, '$1 சமர்ப்பிக்காத சான்றிதழ்கள்').replace(/^Page (\d+) of (\d+)$/, 'பக்கம் $1 / $2').replace(/^(\d+) employees$/, '$1 ஊழியர்கள்');
    if (result === trimmed) return value;
  }
  return value.replace(trimmed, result);
}
export default function TranslationBoundary({
  children
}) {
  const {
    tamil
  } = useLanguage();
  const root = useRef(null);
  useLayoutEffect(() => {
    if (!tamil || !root.current) return;
    function apply(node) {
      if (node.nodeType === Node.TEXT_NODE) {
        const next = translate(node.nodeValue);
        if (next !== node.nodeValue) node.nodeValue = next;
      }
      if (node.nodeType !== Node.ELEMENT_NODE) return;
      for (const attribute of ['placeholder', 'title']) {
        if (node.hasAttribute(attribute)) node.setAttribute(attribute, translate(node.getAttribute(attribute)));
      }
      const walker = document.createTreeWalker(node, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) {
        const next = translate(walker.currentNode.nodeValue);
        if (next !== walker.currentNode.nodeValue) walker.currentNode.nodeValue = next;
      }
      node.querySelectorAll?.('[placeholder], [title]').forEach(element => {
        for (const attribute of ['placeholder', 'title']) if (element.hasAttribute(attribute)) element.setAttribute(attribute, translate(element.getAttribute(attribute)));
      });
    }
    apply(root.current);
    const observer = new MutationObserver(records => records.forEach(record => {
      if (record.type === 'characterData') apply(record.target);
      record.addedNodes.forEach(apply);
    }));
    observer.observe(root.current, {
      childList: true,
      characterData: true,
      subtree: true
    });
    return () => observer.disconnect();
  }, [tamil]);
  return <div className="translated-page" ref={root}>
    {children}
  </div>;
}
